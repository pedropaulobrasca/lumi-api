import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInvoiceTable1743552716220 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "invoice" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "clientNumber" character varying NOT NULL,
                "installationNumber" character varying,
                "referenceMonth" character varying NOT NULL,
                "totalAmount" decimal,
                "electricityConsumption" decimal,
                "electricityValue" decimal,
                "sceeConsumption" decimal,
                "sceeValue" decimal,
                "compensatedEnergyConsumption" decimal,
                "compensatedEnergyValue" decimal,
                "publicLightingContribution" decimal,
                "totalEnergyConsumption" decimal,
                "totalValueWithoutGD" decimal,
                "gdSavings" decimal,
                "energyConsumption" decimal,
                "compensatedEnergy" decimal,
                CONSTRAINT "PK_invoice" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_invoice_clientNumber_referenceMonth" UNIQUE ("clientNumber", "referenceMonth")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "invoice"`);
    }
}
