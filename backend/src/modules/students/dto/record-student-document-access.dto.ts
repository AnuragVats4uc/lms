import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RecordStudentDocumentAccessDto {
  @ApiPropertyOptional({
    description: 'Page count reported by the authorized PDF viewer',
    maximum: 100000,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  @IsOptional()
  totalPages?: number;
}
