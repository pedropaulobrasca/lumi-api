import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceService } from './invoice.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { PdfParserService } from '../parser/pdf-parser.service';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let pdfParserService: PdfParserService;
  let invoiceRepository: Partial<Repository<Invoice>>;

  const mockInvoiceData = {
    clientNumber: '7202210726',
    installationNumber: '3001422762',
    referenceMonth: 'MAI/2024',
    electricEnergy: {
      unit: 'kWh',
      quantity: 100,
      unitPrice: 0.9586,
      value: 95.86
    },
    sceeEnergy: {
      unit: 'kWh',
      quantity: 2220,
      unitPrice: 0.5115,
      value: 1135.57
    },
    compensatedEnergy: {
      unit: 'kWh',
      quantity: 2220,
      unitPrice: 0.4874,
      value: -1081.87
    },
    publicLightingContribution: 40.45
  };

  const mockInvoiceEntity = {
    id: 'some-uuid',
    clientNumber: '7202210726',
    installationNumber: '3001422762',
    referenceMonth: 'MAI/2024',
    electricityConsumption: 100,
    electricityValue: 95.86,
    sceeConsumption: 2220,
    sceeValue: 1135.57,
    compensatedEnergyConsumption: 2220,
    compensatedEnergyValue: -1081.87,
    publicLightingContribution: 40.45,
    totalEnergyConsumption: 2320,
    energyConsumption: 2320,
    compensatedEnergy: 2220,
    totalValueWithoutGD: 1271.88,
    gdSavings: 1081.87,
    totalAmount: 190.01
  };

  beforeEach(async () => {
    invoiceRepository = {
      save: jest.fn().mockImplementation(dto => Promise.resolve({ id: 'some-uuid', ...dto })),
      find: jest.fn().mockResolvedValue([mockInvoiceEntity]),
      findOne: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'existing-id') {
          return Promise.resolve(mockInvoiceEntity);
        }
        return Promise.resolve(null);
      })
    };

    const mockPdfParser = {
      parseInvoice: jest.fn().mockResolvedValue(mockInvoiceData)
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: invoiceRepository as Repository<Invoice>,
        },
        {
          provide: PdfParserService,
          useValue: mockPdfParser,
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    pdfParserService = module.get<PdfParserService>(PdfParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processInvoice', () => {
    it('should process and save invoice', async () => {
      const mockPdfBuffer = Buffer.from('mock pdf content');

      const result = await service.processInvoice(mockPdfBuffer);

      expect(result).toBeDefined();
      expect(result.id).toBe('some-uuid');
      expect(result.clientNumber).toBe('7202210726');
      expect(result.installationNumber).toBe('3001422762');
      expect(result.referenceMonth).toBe('MAI/2024');

      // Check calculated fields
      expect(result.energyConsumption).toBe(2320);
      expect(result.compensatedEnergy).toBe(2220);
      expect(result.totalValueWithoutGD).toBeCloseTo(1271.88, 2);
      expect(result.gdSavings).toBeCloseTo(1081.87, 2);
      expect(result.totalAmount).toBeCloseTo(190.01, 2);

      expect(pdfParserService.parseInvoice).toHaveBeenCalledWith(mockPdfBuffer);
      expect(invoiceRepository.save).toHaveBeenCalled();
    });

    it('should handle invoice with missing data', async () => {
      const mockPdfBuffer = Buffer.from('mock pdf content');
      jest.spyOn(pdfParserService, 'parseInvoice').mockResolvedValueOnce({
        clientNumber: '7202210726',
        referenceMonth: 'JUN/2024',
      });

      const result = await service.processInvoice(mockPdfBuffer);

      expect(result).toBeDefined();
      expect(result.clientNumber).toBe('7202210726');
      expect(result.referenceMonth).toBe('JUN/2024');

      // Check default values for missing fields
      expect(result.energyConsumption).toBe(0);
      expect(result.compensatedEnergy).toBe(0);
      expect(result.totalValueWithoutGD).toBe(0);
      expect(result.gdSavings).toBe(0);
      expect(result.totalAmount).toBe(0);
    });
  });

  describe('calculateVariablesOfInterest', () => {
    it('should correctly calculate variables with complete data', () => {
      const result = service.calculateVariablesOfInterest(mockInvoiceData);

      expect(result.energyConsumption).toBe(2320); // 100 + 2220
      expect(result.compensatedEnergy).toBe(2220);
      expect(result.totalValueWithoutGD).toBeCloseTo(1271.88, 2); // 95.86 + 1135.57 + 40.45
      expect(result.gdSavings).toBeCloseTo(1081.87, 2); // Absolute value of -1081.87
    });

    it('should handle missing data with default values', () => {
      const result = service.calculateVariablesOfInterest({
        // Empty object, all values should default to 0
      });

      expect(result.energyConsumption).toBe(0);
      expect(result.compensatedEnergy).toBe(0);
      expect(result.totalValueWithoutGD).toBe(0);
      expect(result.gdSavings).toBe(0);
    });

    it('should handle partial data', () => {
      const result = service.calculateVariablesOfInterest({
        electricEnergy: {
          quantity: 150,
          value: 120.5
        },
        // Missing other fields
      });

      expect(result.energyConsumption).toBe(150); // Only electric energy
      expect(result.compensatedEnergy).toBe(0); // Default
      expect(result.totalValueWithoutGD).toBeCloseTo(120.5, 2); // Only electric energy value
      expect(result.gdSavings).toBe(0); // Default
    });

    it('should handle negative values correctly', () => {
      const result = service.calculateVariablesOfInterest({
        electricEnergy: {
          quantity: 100,
          value: 95.86
        },
        compensatedEnergy: {
          quantity: 80,
          value: -50.5 // Negative value
        }
      });

      expect(result.energyConsumption).toBe(100);
      expect(result.compensatedEnergy).toBe(80);
      expect(result.totalValueWithoutGD).toBeCloseTo(95.86, 2);
      expect(result.gdSavings).toBeCloseTo(50.5, 2); // Should be absolute value
    });
  });

  describe('findAll', () => {
    it('should return an array of invoices', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockInvoiceEntity]);
      expect(invoiceRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single invoice when it exists', async () => {
      const result = await service.findOne('existing-id');

      expect(result).toEqual(mockInvoiceEntity);
      expect(invoiceRepository.findOne).toHaveBeenCalledWith({ where: { id: 'existing-id' } });
    });

    it('should throw NotFoundException when invoice does not exist', async () => {
      await expect(service.findOne('non-existing-id')).rejects.toThrow(NotFoundException);
      expect(invoiceRepository.findOne).toHaveBeenCalledWith({ where: { id: 'non-existing-id' } });
    });
  });
});