import { ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { RESOURCE_TYPE_ID_VALUES } from '../../resource/constants/resource-type.constants';
import type { ResourceTypeId } from '../../resource/constants/resource-type.constants';

export enum StudentResourcesSort {
  NEWEST = 'NEWEST',
  OLDEST = 'OLDEST',
  TITLE_ASC = 'TITLE_ASC',
  TITLE_DESC = 'TITLE_DESC',
}

export class StudentResourcesQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
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

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sessionCourseId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  folderId?: number;

  @ApiPropertyOptional({ example: '2026-08-19', format: 'date' })
  @IsOptional()
  @IsDateString({ strict: true })
  uploadedOn?: string;

  @ApiPropertyOptional({ enum: ResourceStatus })
  @IsOptional()
  @IsIn([ResourceStatus.PUBLISHED])
  status?: ResourceStatus;

  @ApiPropertyOptional({
    enum: StudentResourcesSort,
    default: StudentResourcesSort.NEWEST,
  })
  @IsOptional()
  @IsEnum(StudentResourcesSort)
  sort?: StudentResourcesSort;
}
