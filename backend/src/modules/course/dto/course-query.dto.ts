import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CourseQueryDto {
  @ApiPropertyOptional({
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    example: 'JEE',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: CourseStatus,
  })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}
