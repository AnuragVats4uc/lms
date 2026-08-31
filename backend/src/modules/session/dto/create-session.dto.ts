import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({
    example: '2025-2026',
    minLength: 3,
    maxLength: 150,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    example: 'Academic year for 2025-2026 admissions.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '2025-04-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2026-03-31T23:59:59.999Z',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    enum: SessionStatus,
    default: SessionStatus.UPCOMING,
  })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}
