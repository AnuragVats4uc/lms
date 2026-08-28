import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ResourceActivityEndReason,
  StudentActivityEventType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class StartResourceActivityDto {
  @ApiPropertyOptional({ description: 'Idempotency key for session creation' })
  @IsUUID()
  @IsOptional()
  clientSessionUuid?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  startPositionSeconds?: number;
}

export class ResourceActivityHeartbeatDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  active: boolean;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  currentPositionSeconds?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  pageNumber?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}

export class DocumentPageActivityDto {
  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNumber: number;
}

export class ResourceActivityEventDto {
  @ApiProperty({ enum: StudentActivityEventType })
  @IsEnum(StudentActivityEventType)
  eventType: StudentActivityEventType;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsUUID()
  @MaxLength(100)
  @IsOptional()
  clientEventId?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  videoPositionSeconds?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  pageNumber?: number;

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class EndResourceActivityDto {
  @ApiProperty({ enum: ResourceActivityEndReason })
  @IsEnum(ResourceActivityEndReason)
  reason: ResourceActivityEndReason;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  currentPositionSeconds?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  pageNumber?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
