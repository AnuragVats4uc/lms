import { ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { RESOURCE_TYPE_ID_VALUES } from '../constants/resource-type.constants';
import type { ResourceTypeId } from '../constants/resource-type.constants';

export class ResourceQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 'Motion' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: RESOURCE_TYPE_ID_VALUES,
    description: '1 = Document, 2 = Video, 3 = Exam',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(RESOURCE_TYPE_ID_VALUES)
  resourceTypeId?: ResourceTypeId;

  @ApiPropertyOptional({ enum: ResourceStatus })
  @IsOptional()
  @IsEnum(ResourceStatus)
  status?: ResourceStatus;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') return value;
    return value === true || value === 'true';
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
