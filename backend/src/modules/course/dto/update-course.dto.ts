import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateCourseDto {
  @ApiPropertyOptional({
    example: 'JEE Foundation',
    minLength: 3,
    maxLength: 150,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    example: 'JEE-FDN',
    maxLength: 30,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(30)
  code?: string;

  @ApiPropertyOptional({
    example: 'Foundation course for JEE aspirants.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/courses/jee-foundation.png',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsUrl()
  thumbnail?: string;

  @ApiPropertyOptional({
    example: 365,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationInDays?: number;

  @ApiPropertyOptional({
    enum: CourseStatus,
  })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
