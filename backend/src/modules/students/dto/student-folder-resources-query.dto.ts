import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { RESOURCE_TYPE_ID_VALUES } from '../../resource/constants/resource-type.constants';
import type { ResourceTypeId } from '../../resource/constants/resource-type.constants';
import { StudentResourcesSort } from './student-resources-query.dto';

export class StudentFolderResourcesQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 12, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 'number systems' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: RESOURCE_TYPE_ID_VALUES })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(RESOURCE_TYPE_ID_VALUES)
  resourceTypeId?: ResourceTypeId;

  @ApiPropertyOptional({ example: '2026-08-21', format: 'date' })
  @IsOptional()
  @IsDateString({ strict: true })
  uploadedOn?: string;

  @ApiPropertyOptional({
    enum: StudentResourcesSort,
    default: StudentResourcesSort.NEWEST,
  })
  @IsOptional()
  @IsEnum(StudentResourcesSort)
  sort?: StudentResourcesSort;
}
