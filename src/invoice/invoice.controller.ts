import { Controller, Post, UploadedFile, UseInterceptors, Get, Param, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoiceService } from './invoice.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UploadInvoiceDto } from './dto/upload-invoice.dto';
import { UploadInvoiceResponseDto, InvoiceResponseDto } from './dto/invoice.dto';

@ApiTags('invoices')
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) { }

  @Post('upload')
  @ApiOperation({ summary: 'Fazer upload de uma fatura de energia em PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadInvoiceDto })
  @ApiResponse({
    status: 201,
    description: 'Fatura processada com sucesso',
    type: UploadInvoiceResponseDto
  })
  @ApiResponse({ status: 400, description: 'Requisição inválida' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadInvoice(@UploadedFile() file: Express.Multer.File) {
    return this.invoiceService.processInvoice(file.buffer);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as faturas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de faturas retornada com sucesso',
    type: [InvoiceResponseDto]
  })
  async findAll() {
    return this.invoiceService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma fatura pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da fatura', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Fatura encontrada com sucesso',
    type: InvoiceResponseDto
  })
  @ApiResponse({ status: 404, description: 'Fatura não encontrada' })
  async findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(id);
  }
}