import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
@Unique(['clientNumber', 'referenceMonth']) // Criando uma restrição de unicidade composta
export class Invoice {
  @ApiProperty({ description: 'ID único da fatura', example: 1 })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ description: 'Número do cliente', example: '7202210726' })
  @Column()
  clientNumber: string;

  @ApiProperty({ description: 'Número da instalação', example: '3001422762' })
  @Column({ nullable: true })
  installationNumber: string;

  @ApiProperty({ description: 'Mês de referência', example: 'MAI/2024' })
  @Column()
  referenceMonth: string;

  @ApiProperty({ description: 'Valor total da fatura em R$', example: 107.38 })
  @Column('decimal', { nullable: true })
  totalAmount: number;

  // Campos de energia e valores
  @ApiProperty({ description: 'Consumo de energia elétrica em kWh', example: 100 })
  @Column('decimal', { nullable: true })
  electricityConsumption: number;

  @ApiProperty({ description: 'Valor da energia elétrica em R$', example: 95.86 })
  @Column('decimal', { nullable: true })
  electricityValue: number;

  @ApiProperty({ description: 'Consumo SCEE em kWh', example: 2220 })
  @Column('decimal', { nullable: true })
  sceeConsumption: number;

  @ApiProperty({ description: 'Valor SCEE em R$', example: 1135.57 })
  @Column('decimal', { nullable: true })
  sceeValue: number;

  @ApiProperty({ description: 'Consumo de energia compensada em kWh', example: 2220 })
  @Column('decimal', { nullable: true })
  compensatedEnergyConsumption: number;

  @ApiProperty({ description: 'Valor da energia compensada em R$', example: -1081.87 })
  @Column('decimal', { nullable: true })
  compensatedEnergyValue: number;

  @ApiProperty({ description: 'Contribuição para iluminação pública em R$', example: 40.45 })
  @Column('decimal', { nullable: true })
  publicLightingContribution: number;

  // Campos calculados para o dashboard
  @ApiProperty({ description: 'Consumo total de energia em kWh', example: 2320 })
  @Column('decimal', { nullable: true })
  totalEnergyConsumption: number;

  @ApiProperty({ description: 'Valor total sem GD em R$', example: 1271.88 })
  @Column('decimal', { nullable: true })
  totalValueWithoutGD: number;

  @ApiProperty({ description: 'Economia com GD em R$', example: 1081.87 })
  @Column('decimal', { nullable: true })
  gdSavings: number;

  // Campos para compatibilidade com o parser e service
  @ApiProperty({ description: 'Energia consumida (campo para cálculos)', example: 2320 })
  @Column('decimal', { nullable: true })
  energyConsumption: number;

  @ApiProperty({ description: 'Energia compensada (campo para cálculos)', example: 2220 })
  @Column('decimal', { nullable: true })
  compensatedEnergy: number;
}