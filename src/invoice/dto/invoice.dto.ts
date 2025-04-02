import { ApiProperty } from '@nestjs/swagger';

export class InvoiceResponseDto {
  @ApiProperty({ description: 'ID único da fatura', example: '944097cb-4513-4663-82ce-089ee2b7031c' })
  id: string;

  @ApiProperty({ description: 'Número do cliente', example: '7202210726' })
  clientNumber: string;

  @ApiProperty({ description: 'Número da instalação', example: '3001422762' })
  installationNumber: string;

  @ApiProperty({ description: 'Mês de referência', example: 'MAI/2024' })
  referenceMonth: string;

  @ApiProperty({ description: 'Valor total da fatura em R$', example: 107.38 })
  totalAmount: number;

  // Campos de energia e valores
  @ApiProperty({ description: 'Consumo de energia elétrica em kWh', example: 100 })
  electricityConsumption: number;

  @ApiProperty({ description: 'Valor da energia elétrica em R$', example: 95.86 })
  electricityValue: number;

  @ApiProperty({ description: 'Consumo SCEE em kWh', example: 2220 })
  sceeConsumption: number;

  @ApiProperty({ description: 'Valor SCEE em R$', example: 1135.57 })
  sceeValue: number;

  @ApiProperty({ description: 'Consumo de energia compensada em kWh', example: 2220 })
  compensatedEnergyConsumption: number;

  @ApiProperty({ description: 'Valor da energia compensada em R$', example: -1081.87 })
  compensatedEnergyValue: number;

  @ApiProperty({ description: 'Contribuição para iluminação pública em R$', example: 40.45 })
  publicLightingContribution: number;

  // Campos calculados para o dashboard
  @ApiProperty({ description: 'Consumo total de energia em kWh', example: 2320 })
  totalEnergyConsumption: number;

  @ApiProperty({ description: 'Valor total sem GD em R$', example: 1271.88 })
  totalValueWithoutGD: number;

  @ApiProperty({ description: 'Economia com GD em R$', example: 1081.87 })
  gdSavings: number;
}

export class InvoiceDashboardDto {
  @ApiProperty({ description: 'Mês de referência', example: 'MAI/2024' })
  referenceMonth: string;

  @ApiProperty({ description: 'Consumo de energia elétrica em kWh', example: 2320 })
  energyConsumption: number;

  @ApiProperty({ description: 'Energia compensada em kWh', example: 2220 })
  compensatedEnergy: number;

  @ApiProperty({ description: 'Valor total sem GD em R$', example: 1271.88 })
  totalValueWithoutGD: number;

  @ApiProperty({ description: 'Economia com GD em R$', example: 1081.87 })
  gdSavings: number;
}

export class InvoiceFilterDto {
  @ApiProperty({ description: 'Número do cliente', example: '7202210726', required: false })
  clientNumber?: string;

  @ApiProperty({ description: 'Data inicial (mês/ano)', example: 'JAN/2024', required: false })
  startDate?: string;

  @ApiProperty({ description: 'Data final (mês/ano)', example: 'DEZ/2024', required: false })
  endDate?: string;
}

export class UploadInvoiceResponseDto {
  @ApiProperty({ description: 'Mensagem de sucesso', example: 'Fatura processada com sucesso' })
  message: string;

  @ApiProperty({ description: 'Dados da fatura processada', type: InvoiceResponseDto })
  invoice: InvoiceResponseDto;
}
