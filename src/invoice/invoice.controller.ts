import { Controller, Post, UploadedFile, UseInterceptors, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoiceService } from './invoice.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
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
  @ApiResponse({ status: 409, description: 'Fatura duplicada' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadInvoice(@UploadedFile() file: Express.Multer.File) {
    try {
      const result = await this.invoiceService.processInvoice(file.buffer);
      return {
        id: result.id,
        message: 'Fatura processada com sucesso'
      };
    } catch (error) {
      // Se for um erro de fatura duplicada
      if (error.status === 409) {
        throw new HttpException({
          status: HttpStatus.CONFLICT,
          message: error.message,
          error: 'Fatura duplicada'
        }, HttpStatus.CONFLICT);
      }

      // Outros erros
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro ao processar a fatura',
        error: error.message || 'Erro interno do servidor'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as faturas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de faturas retornada com sucesso',
    type: [InvoiceResponseDto]
  })
  @ApiQuery({
    name: 'clientNumber',
    required: false
  })
  @ApiQuery({
    name: 'startMonth',
    required: false
  })
  async findAll(
    @Query('clientNumber') clientNumber?: string,
    @Query('startMonth') startMonth?: string,
  ) {
    return this.invoiceService.findAll(clientNumber, startMonth);
  }

  @Get('reference-months/list')
  @ApiOperation({ summary: 'Listar todos os meses de referência disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Lista de meses de referência retornada com sucesso',
    type: [String]
  })
  async getReferenceMonths() {
    return this.invoiceService.getReferenceMonths();
  }

  @Get('clients/list')
  @ApiOperation({ summary: 'Listar todos os clientes disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes retornada com sucesso',
    type: [String]
  })
  async getClients() {
    return this.invoiceService.getClients();
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