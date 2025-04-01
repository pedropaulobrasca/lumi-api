import { Injectable } from '@nestjs/common';
import pdf from 'pdf-parse';

@Injectable()
export class PdfParserService {
  async parseInvoice(pdfBuffer: Buffer): Promise<any> {
    const data = await pdf(pdfBuffer);
    const text = data.text;

    // Extração de dados com verificação de nulidade
    const clientNumberMatch = text.match(/Nº DO CLIENTE\s*#?\s*(\d+)/i);
    const referenceMonthMatch = text.match(/Referente a\s*#?\s*([A-Z]{3}\/\d{4})/i);

    // Verificar se os padrões foram encontrados
    const clientNumber = clientNumberMatch ? clientNumberMatch[1] : null;
    const referenceMonth = referenceMonthMatch ? referenceMonthMatch[1] : null;

    return {
      clientNumber,
      referenceMonth,
    };
  }
}