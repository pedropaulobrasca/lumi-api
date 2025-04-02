import { ApiProperty } from '@nestjs/swagger';

export class UploadInvoiceDto {
  @ApiProperty({ 
    description: 'Arquivo PDF da fatura de energia', 
    type: 'string', 
    format: 'binary',
    required: true
  })
  file: Express.Multer.File;
}
