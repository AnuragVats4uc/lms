import { ApiPropertyOptional } from '@nestjs/swagger';
import { StudentActivityEventType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const REPORT_ACTIVITY_TYPES = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  ...Object.values(StudentActivityEventType).filter(
    (type) => type !== 'LOGIN_SUCCESS' && type !== 'LOGOUT',
  ),
] as const;

export type ReportActivityType = (typeof REPORT_ACTIVITY_TYPES)[number];

const toStringArray = ({ value }: { value: unknown }) => {
  if (Array.isArray(value))
    return value
      .flatMap((item) => String(item).split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  if (typeof value === 'string')
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  return value;
};

export class StudentActivityReportQueryDto {
  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-08-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ example: 21 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sessionCourseId?: number;

  @ApiPropertyOptional({ example: 'VIDEO' })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({ enum: REPORT_ACTIVITY_TYPES, isArray: true })
  @IsOptional()
  @Transform(toStringArray)
  @IsIn(REPORT_ACTIVITY_TYPES, { each: true })
  activityTypes?: ReportActivityType[];

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class StudentActivityReportExportQueryDto extends StudentActivityReportQueryDto {
  @ApiPropertyOptional({ enum: ['csv', 'xlsx'], default: 'xlsx' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn(['csv', 'xlsx'])
  format?: 'csv' | 'xlsx';
}
