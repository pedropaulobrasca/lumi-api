import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { PdfParserService } from '../parser/pdf-parser.service';

interface InvoiceCalculations {
  energyConsumption: number;
  compensatedEnergy: number;
  totalValueWithoutGD: number;
  gdSavings: number;
}

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    private pdfParser: PdfParserService,
  ) { }

  async processInvoice(pdfBuffer: Buffer): Promise<Invoice> {
    const parsedData = await this.pdfParser.parseInvoice(pdfBuffer);

    // Calculate the variables of interest
    const calculations = this.calculateVariablesOfInterest(parsedData);

    // Map the parsed data to the entity fields
    const invoiceData: Partial<Invoice> = {
      clientNumber: parsedData.clientNumber,
      installationNumber: parsedData.installationNumber,
      referenceMonth: parsedData.referenceMonth,

      // Calculated fields
      energyConsumption: calculations.energyConsumption,
      compensatedEnergy: calculations.compensatedEnergy,
      totalValueWithoutGD: calculations.totalValueWithoutGD,
      gdSavings: calculations.gdSavings,

      // Map the fields from parsedData to the entity fields
      electricityConsumption: parsedData.electricEnergy?.quantity,
      electricityValue: parsedData.electricEnergy?.value,
      sceeConsumption: parsedData.sceeEnergy?.quantity,
      sceeValue: parsedData.sceeEnergy?.value,
      compensatedEnergyConsumption: typeof parsedData.compensatedEnergy === 'object' ?
        parsedData.compensatedEnergy?.quantity : undefined,
      compensatedEnergyValue: typeof parsedData.compensatedEnergy === 'object' ?
        parsedData.compensatedEnergy?.value : undefined,
      totalEnergyConsumption: calculations.energyConsumption,
      publicLightingContribution: parsedData.publicLightingContribution,

      // Calculate total amount (total after GD savings)
      totalAmount: calculations.totalValueWithoutGD - calculations.gdSavings,
    };

    return this.invoiceRepository.save(invoiceData);
  }

  /**
   * Calcula as variáveis de interesse conforme especificado:
   * - Consumo de Energia (KWh): soma de 'Energia Elétrica kWh' + 'Energia SCEEE s/ICMS kWh'
   * - Energia Compensada (kWh): corresponde a 'Energia Compensada GD I (kWh)'
   * - Valor Total sem GD (R$): soma de 'Energia Elétrica (R$)' + 'Energia SCEE s/ ICMS (R$)' + 'Contrib Ilum Publica Municipal (R$)'
   * - Economia GD (R$): corresponde a 'Energia compensada GD I (R$)'
   */
  calculateVariablesOfInterest(invoiceData: any): InvoiceCalculations {
    // Default values in case data is not present
    const electricEnergyKWh = invoiceData.electricEnergy?.quantity || 0;
    const sceeeEnergyKWh = invoiceData.sceeEnergy?.quantity || 0;
    const compensatedEnergyKWh = invoiceData.compensatedEnergy?.quantity || 0;

    const electricEnergyValue = invoiceData.electricEnergy?.value || 0;
    const sceeeEnergyValue = invoiceData.sceeEnergy?.value || 0;
    const publicLightingContribution = invoiceData.publicLightingContribution || 0;
    const compensatedEnergyValue = Math.abs(invoiceData.compensatedEnergy?.value || 0);

    return {
      // Consumo de Energia = Energia Elétrica kWh + Energia SCEEE kWh
      energyConsumption: electricEnergyKWh + sceeeEnergyKWh,

      // Energia Compensada = Energia Compensada GD I (kWh)
      compensatedEnergy: compensatedEnergyKWh,

      // Valor Total sem GD = Energia Elétrica (R$) + Energia SCEE (R$) + Contribuição Iluminação Pública Municipal (R$)
      totalValueWithoutGD: electricEnergyValue + sceeeEnergyValue + publicLightingContribution,

      // Economia GD = Energia Compensada GD I (R$) [valor absoluto, pois é negativo na fatura]
      gdSavings: compensatedEnergyValue,
    };
  }

  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepository.find();
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }
}