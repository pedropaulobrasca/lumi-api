import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceService } from './invoice.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';

describe('InvoiceService', () => {
  let service: InvoiceService;

  const mockRepository = {
    save: jest.fn().mockImplementation(dto => Promise.resolve(dto)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
  });

  it('should process and save invoice', async () => {
    const mockPdfBuffer = Buffer.from('...');
    const result = await service.processInvoice(mockPdfBuffer);
    expect(result).toBeDefined();
    expect(mockRepository.save).toHaveBeenCalled();
  });
});