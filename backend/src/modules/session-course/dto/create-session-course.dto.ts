import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionCourseStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSessionCourseDto {
  @ApiProperty({
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  courseId: number;

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
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    enum: SessionCourseStatus,
    default: SessionCourseStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(SessionCourseStatus)
  status?: SessionCourseStatus;
}
