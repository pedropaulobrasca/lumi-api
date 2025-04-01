import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { PdfParserService } from '../parser/pdf-parser.service';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    private pdfParser: PdfParserService,
  ) { }

  async processInvoice(pdfBuffer: Buffer): Promise<Invoice> {
    const parsedData = await this.pdfParser.parseInvoice(pdfBuffer);

    // Cálculos
    parsedData.totalEnergyConsumption =
      parsedData.electricityConsumption + parsedData.sceeConsumption;

    parsedData.totalValueWithoutGD =
      parsedData.electricityValue +
      parsedData.sceeValue +
      parsedData.publicLightingContribution;

    return this.invoiceRepository.save(parsedData);
  }

  // Implementar métodos para busca e relatórios
}