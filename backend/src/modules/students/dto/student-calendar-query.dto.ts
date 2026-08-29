import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export enum StudentCalendarEventType {
  EXAM = 'EXAM',
  ACADEMIC_SESSION = 'ACADEMIC_SESSION',
}

export class StudentCalendarQueryDto {
  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-09-12T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    enum: StudentCalendarEventType,
    isArray: true,
    example: ['EXAM', 'ACADEMIC_SESSION'],
  })
  @Transform(({ value }: { value: unknown }) => {
    const values = Array.isArray(value) ? value : String(value).split(',');
    return values.map((item) => String(item).trim()).filter(Boolean);
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(2)
  @IsEnum(StudentCalendarEventType, { each: true })
  types?: StudentCalendarEventType[];

  @ApiPropertyOptional({ example: 1, description: 'Master course id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  courseId?: number;

  @ApiPropertyOptional({ example: 'quantitative' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
