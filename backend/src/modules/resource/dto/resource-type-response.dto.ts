import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { ResourceTypeCode } from '../constants/resource-type.constants';

export class ResourceTypeDataDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: ['DOCUMENT', 'VIDEO', 'EXAM'], example: 'DOCUMENT' })
  code: ResourceTypeCode;

  @ApiProperty({ example: 'Document' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;
}

export class ResourceTypeListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: [ResourceTypeDataDto] })
  data: ResourceTypeDataDto[];

  @ApiProperty({ example: '2026-08-19T08:30:00.000Z' })
  timestamp: string;
}
