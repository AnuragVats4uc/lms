import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum StudentNotificationCategory {
  EXAM = 'EXAM',
  RESOURCE = 'RESOURCE',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  SYSTEM = 'SYSTEM',
}

export enum StudentNotificationReadStatus {
  ALL = 'ALL',
  UNREAD = 'UNREAD',
  READ = 'READ',
}

export class StudentNotificationsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    enum: StudentNotificationCategory,
    isArray: true,
    example: ['EXAM', 'RESOURCE'],
  })
  @Transform(({ value }: { value: unknown }) => {
    const values = Array.isArray(value) ? value : String(value).split(',');
    return values.map((item) => String(item).trim()).filter(Boolean);
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsEnum(StudentNotificationCategory, { each: true })
  types?: StudentNotificationCategory[];

  @ApiPropertyOptional({
    enum: StudentNotificationReadStatus,
    default: StudentNotificationReadStatus.ALL,
  })
  @IsOptional()
  @IsEnum(StudentNotificationReadStatus)
  status?: StudentNotificationReadStatus;

  @ApiPropertyOptional({ example: 'mock test' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
