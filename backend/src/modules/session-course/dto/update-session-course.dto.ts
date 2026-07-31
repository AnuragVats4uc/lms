import { ApiPropertyOptional } from '@nestjs/swagger';
import { SessionCourseStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSessionCourseDto {
  @ApiPropertyOptional({
    example: 'JEE Foundation - Morning Batch',
    maxLength: 150,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(150)
  displayName?: string;

  @ApiPropertyOptional({
    example: 'Session-specific display details for this course.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({
    enum: SessionCourseStatus,
  })
  @IsOptional()
  @IsEnum(SessionCourseStatus)
  status?: SessionCourseStatus;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
