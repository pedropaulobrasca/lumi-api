import { Injectable } from '@nestjs/common';
import { PDFExtract, PDFExtractOptions } from 'pdf.js-extract';

interface InvoiceData {
  clientNumber?: string;
  installationNumber?: string;
  referenceMonth?: string;
  electricEnergy?: {
    unit: string;
    quantity: number;
    unitPrice: number;
    value: number;
  };
  sceeEnergy?: {
    unit: string;
    quantity: number;
    unitPrice: number;
    value: number;
  };
  compensatedEnergy?: {
    unit: string;
    quantity: number;
    unitPrice: number;
    value: number;
  } | number;
  publicLightingContribution?: number;
}

@Injectable()
export class PdfParserService {
  private pdfExtract: PDFExtract;

  constructor() {
    this.pdfExtract = new PDFExtract();
  }

  async parseInvoice(pdfBuffer: Buffer): Promise<InvoiceData> {
    const options: PDFExtractOptions = {};
    const data = await this.pdfExtract.extractBuffer(pdfBuffer, options);
    // Corrigir para juntar o array em uma única string
    const fullText = data.pages.map(p => p.content.map(c => c.str).join(' ')).join('\n');

    // Extrair dados básicos
    const clientInfo = this.extractClientInfo(fullText);
    const refMonthMatch = fullText.match(/Valor a pagar \(R\$\)\s+([A-Z]{3}\/\d{4})/);

    // Extrair dados de energia
    const energyData = this.extractEnergyData(fullText);

    return {
      clientNumber: clientInfo.clientNumber,
      installationNumber: clientInfo.installationNumber,
      referenceMonth: refMonthMatch?.[1],
      ...energyData,
    };
  }

  private extractClientInfo(text: string): { clientNumber: string; installationNumber: string; } {
    // Extrair Nº DO CLIENTE e Nº DA INSTALAÇÃO
    const clientSectionMatch = text.match(
      /Nº DO CLIENTE\s+Nº DA INSTALAÇÃO\s+([\d\s]+)\s+([\d\s]+)/i
    );

    let clientNumber = '';
    let installationNumber = '';

    if (clientSectionMatch && clientSectionMatch.length >= 3) {
      clientNumber = clientSectionMatch[1].split('   ')[0];
      installationNumber = clientSectionMatch[1].split('   ')[1];
    }

    return { clientNumber, installationNumber };
  }

  private parseBrazilianNumber(value: string): number {
    return parseFloat(
      value
        .replace(/\./g, '') // Remover separadores de milhares
        .replace(/,/g, '.') // Converter vírgula decimal para ponto
    );
  }

  private extractEnergyData(text: string) {
    // Procurar por variações do texto "Energia compensada"
    const compensatedEnergyRegex = /Energia\s+compensada[^0-9\n]*([\d.,]+)[^0-9\n]*([\d.,]+)[^0-9\n]*([\d.,]+)/gi;
    const matches = text.match(compensatedEnergyRegex);

    // Encontrar a linha completa que contém "Energia compensada"
    const lines = text.split('\n');
    const compensatedEnergyLines = lines.filter(line => line.includes('compensada'));

    const result: {
      electricEnergy?: { unit: string; quantity: number; unitPrice: number; value: number };
      sceeEnergy?: { unit: string; quantity: number; unitPrice: number; value: number };
      compensatedEnergy?: { unit: string; quantity: number; unitPrice: number; value: number };
      publicLightingContribution?: number;
    } = {};

    // Expressões regulares para cada tipo de energia
    const patterns = {
      electricEnergy: /Energia Elétrica\s+kWh\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/,
      sceeEnergy: /Energia SCEE s\/ ICMS\s+kWh\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/,
      compensatedEnergy: /Energia compensada GD I\s+kWh\s+([\d.,]+)\s+([\d.,]+)\s+(-[\d.,]+)/,
      publicLightingContribution: /Contrib Ilum Publica Municipal\s+([\d.,]+)/,
    };

    // Processar cada padrão
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        if (key === 'publicLightingContribution') {
          result[key] = this.parseBrazilianNumber(match[1]);
        } else {
          result[key] = {
            unit: 'kWh',
            quantity: this.parseBrazilianNumber(match[1]),
            unitPrice: this.parseBrazilianNumber(match[2]),
            value: this.parseBrazilianNumber(match[3]),
          };
        }
      }
    }

    return result;
  }
}