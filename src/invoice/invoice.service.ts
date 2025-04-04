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

    // Verificar se já existe uma fatura com o mesmo número de cliente, instalação e mês de referência
    const existingInvoice = await this.invoiceRepository.findOne({
      where: {
        clientNumber: parsedData.clientNumber,
        installationNumber: parsedData.installationNumber,
        referenceMonth: parsedData.referenceMonth
      }
    });

    if (existingInvoice) {
      const error: any = new Error('Fatura duplicada');
      error.status = 409;
      error.message = `Já existe uma fatura para o cliente ${parsedData.clientNumber}, instalação ${parsedData.installationNumber} no mês ${parsedData.referenceMonth}`;
      throw error;
    }

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

  async findAll(clientNumber?: string, startMonth?: string, endMonth?: string): Promise<Invoice[]> {
    // Construir a query base
    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice');
    
    // Aplicar filtro por número do cliente se fornecido
    if (clientNumber) {
      queryBuilder.andWhere('invoice.clientNumber = :clientNumber', { clientNumber });
    }
    
    // Aplicar filtro por período se fornecido
    if (startMonth && endMonth) {
      // Convertendo os meses para um formato comparável (assumindo formato MMM/YYYY)
      queryBuilder.andWhere(
        'invoice.referenceMonth BETWEEN :startMonth AND :endMonth',
        { startMonth, endMonth }
      );
    } else if (startMonth) {
      queryBuilder.andWhere('invoice.referenceMonth >= :startMonth', { startMonth });
    } else if (endMonth) {
      queryBuilder.andWhere('invoice.referenceMonth <= :endMonth', { endMonth });
    }
    
    // Ordenar por mês de referência (do mais recente para o mais antigo)
    queryBuilder.orderBy('invoice.referenceMonth', 'DESC');
    
    // Buscar as faturas
    const invoices = await queryBuilder.getMany();
    
    // Converter os valores de string para número
    return invoices.map(invoice => ({
      ...invoice,
      // Converter campos numéricos
      totalAmount: this.toNumber(invoice.totalAmount),
      electricityConsumption: this.toNumber(invoice.electricityConsumption),
      electricityValue: this.toNumber(invoice.electricityValue),
      sceeConsumption: this.toNumber(invoice.sceeConsumption),
      sceeValue: this.toNumber(invoice.sceeValue),
      compensatedEnergyConsumption: this.toNumber(invoice.compensatedEnergyConsumption),
      compensatedEnergyValue: this.toNumber(invoice.compensatedEnergyValue),
      publicLightingContribution: this.toNumber(invoice.publicLightingContribution),
      totalEnergyConsumption: this.toNumber(invoice.totalEnergyConsumption),
      totalValueWithoutGD: this.toNumber(invoice.totalValueWithoutGD),
      gdSavings: this.toNumber(invoice.gdSavings),
      energyConsumption: this.toNumber(invoice.energyConsumption),
      compensatedEnergy: this.toNumber(invoice.compensatedEnergy),
    }));
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Converter os valores de string para número
    return {
      ...invoice,
      // Converter campos numéricos
      totalAmount: this.toNumber(invoice.totalAmount),
      electricityConsumption: this.toNumber(invoice.electricityConsumption),
      electricityValue: this.toNumber(invoice.electricityValue),
      sceeConsumption: this.toNumber(invoice.sceeConsumption),
      sceeValue: this.toNumber(invoice.sceeValue),
      compensatedEnergyConsumption: this.toNumber(invoice.compensatedEnergyConsumption),
      compensatedEnergyValue: this.toNumber(invoice.compensatedEnergyValue),
      publicLightingContribution: this.toNumber(invoice.publicLightingContribution),
      totalEnergyConsumption: this.toNumber(invoice.totalEnergyConsumption),
      totalValueWithoutGD: this.toNumber(invoice.totalValueWithoutGD),
      gdSavings: this.toNumber(invoice.gdSavings),
      energyConsumption: this.toNumber(invoice.energyConsumption),
      compensatedEnergy: this.toNumber(invoice.compensatedEnergy),
    };
  }
  
  // Método auxiliar para converter valores para número
  private toNumber(value: any): number {
    if (value === null || value === undefined) {
      return 0;
    }
    
    // Se já for um número, retorna o valor
    if (typeof value === 'number') {
      return value;
    }
    
    // Se for uma string, converte para número
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    return 0;
  }

  /**
   * Retorna a lista de todos os meses de referência disponíveis
   */
  async getReferenceMonths(): Promise<string[]> {
    // Buscar meses de referência únicos e ordenar por data (mais recente primeiro)
    const result = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('invoice.referenceMonth', 'referenceMonth')
      .distinct(true)
      .orderBy('invoice.referenceMonth', 'DESC')
      .getRawMany();
    
    // Extrair os meses de referência do resultado
    return result.map(item => item.referenceMonth);
  }

  /**
   * Retorna a lista de todos os clientes disponíveis
   */
  async getClients(): Promise<{clientNumber: string, installationNumber: string}[]> {
    // Buscar clientes únicos
    const result = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('invoice.clientNumber', 'clientNumber')
      .addSelect('invoice.installationNumber', 'installationNumber')
      .distinct(true)
      .orderBy('invoice.clientNumber', 'ASC')
      .getRawMany();
    
    // Extrair os números de cliente do resultado
    return result.map(item => ({
      clientNumber: item.clientNumber,
      installationNumber: item.installationNumber
    }));
  }
}