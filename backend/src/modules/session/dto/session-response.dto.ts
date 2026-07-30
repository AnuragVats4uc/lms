import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '@prisma/client';

export class SessionDataDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    example: '58592738-88e3-44ff-a72f-5ad4c767518d',
  })
  uuid: string;

  @ApiProperty({ example: 1 })
  organizationId: number;

  @ApiProperty({ example: '2025-2026' })
  name: string;

  @ApiPropertyOptional({ example: 'AY2526' })
  code?: string | null;

  @ApiPropertyOptional({
    example: 'Academic year for 2025-2026 admissions.',
  })
  description?: string | null;

  @ApiProperty({ example: '2025-04-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2026-03-31T23:59:59.999Z' })
  endDate: Date;

  @ApiProperty({ enum: SessionStatus })
  status: SessionStatus;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  updatedAt: Date;
}

export class SessionListMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class SessionListDataDto {
  @ApiProperty({ type: [SessionDataDto] })
  items: SessionDataDto[];

  @ApiProperty({ type: SessionListMetaDto })
  meta: SessionListMetaDto;
}

export class SessionResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: SessionDataDto })
  data: SessionDataDto;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  timestamp: string;
}

export class SessionListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: SessionListDataDto })
  data: SessionListDataDto;

  @ApiProperty({ example: '2026-07-30T00:00:00.000Z' })
  timestamp: string;
}
