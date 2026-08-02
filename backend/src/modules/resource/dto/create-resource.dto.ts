import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceStatus, ResourceType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateResourceDto {
  @ApiProperty({ example: 'Motion Notes', minLength: 1, maxLength: 200 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Chapter notes for motion.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ResourceType, example: ResourceType.DOCUMENT })
  @IsEnum(ResourceType)
  type: ResourceType;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/motion-notes.pdf' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsUrl()
  documentUrl?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/motion-lecture.mp4',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examId?: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/motion.png' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsUrl()
  thumbnail?: string;

  @ApiPropertyOptional({ example: 'application/pdf', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  mimeType?: string;

  @ApiPropertyOptional({
    example: '204800',
    description: 'File size in bytes, represented as a decimal string.',
  })
  @IsOptional()
  @IsNumberString()
  fileSize?: string;

  @ApiPropertyOptional({ example: 3600, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationInSeconds?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ enum: ResourceStatus, default: ResourceStatus.DRAFT })
  @IsOptional()
  @IsEnum(ResourceStatus)
  status?: ResourceStatus;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isDownloadable?: boolean;
}
