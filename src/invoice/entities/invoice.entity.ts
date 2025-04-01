import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  clientNumber: string;

  @Column()
  referenceMonth: string;

  @Column('decimal')
  electricityConsumption: number;

  @Column('decimal')
  electricityValue: number;

  @Column('decimal')
  sceeConsumption: number;

  @Column('decimal')
  sceeValue: number;

  @Column('decimal')
  compensatedEnergyConsumption: number;

  @Column('decimal')
  compensatedEnergyValue: number;

  @Column('decimal')
  publicLightingContribution: number;

  // Campos calculados
  @Column('decimal')
  totalEnergyConsumption: number;

  @Column('decimal')
  totalValueWithoutGD: number;
}