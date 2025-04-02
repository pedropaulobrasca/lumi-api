import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceModule } from './invoice/invoice.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'secret',
      database: process.env.DB_NAME ?? 'energy_invoices',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // Desativado para usar migrações
      migrationsRun: true, // Executa migrações automaticamente
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        store: redisStore,
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379'),
        ttl: 60 * 60, // 1 hora em segundos
      }),
    }),
    InvoiceModule,
  ],
})
export class AppModule { }