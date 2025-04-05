import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/invoices (GET) - Deve retornar array vazio ou com itens contendo clientNumber', () => {
    return request(app.getHttpServer())
      .get('/invoices')
      .expect(200)
      .expect((res) => {
        // Verificação básica do tipo array
        expect(Array.isArray(res.body)).toBe(true);

        // Verifica se o array tem 0 elementos OU
        // se os elementos contêm clientNumber
        if (res.body.length > 0) {
          res.body.forEach((invoice) => {
            // Verifica existência do campo
            expect(invoice).toHaveProperty('clientNumber');

            // Verificação adicional do tipo (opcional)
            expect(typeof invoice.clientNumber).toBe('string');
          });
        }
      });
  });

  it('/invoices/reference-months/list (GET) - Deve retornar array vazio ou com itens contendo todos os meses de referência disponíveis', () => {
    return request(app.getHttpServer())
      .get('/invoices/reference-months/list')
      .expect(200)
      .expect((res) => {
        // Verificação básica do tipo array
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/invoices/clients/list (GET) - Deve retornar array vazio ou com itens contendo todos os clientes disponíveis', () => {
    return request(app.getHttpServer())
      .get('/invoices/clients/list')
      .expect(200)
      .expect((res) => {
        // Verificação básica do tipo array
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});