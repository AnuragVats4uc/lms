import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationStatus } from '@prisma/client';

export class OrganizationDataDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    example: '58592738-88e3-44ff-a72f-5ad4c767518d',
  })
  uuid: string;

  @ApiProperty({ example: 'Acme Learning Institute' })
  name: string;

  @ApiProperty({ example: 'ACME' })
  code: string;

  @ApiPropertyOptional({
    example: 'Online learning programs.',
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/acme-logo.png',
  })
  logo?: string | null;

  @ApiPropertyOptional({
    example: 'https://acme-learning.example.com',
  })
  website?: string | null;

  @ApiPropertyOptional({
    example: 'admin@acme-learning.example.com',
  })
  email?: string | null;

  @ApiPropertyOptional({ example: '+919999999999' })
  phone?: string | null;

  @ApiPropertyOptional({ example: 'Sector 12, New Delhi' })
  address?: string | null;

  @ApiProperty({ enum: OrganizationStatus })
  status: OrganizationStatus;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-07-24T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-24T00:00:00.000Z' })
  updatedAt: Date;
}

export class OrganizationListMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class OrganizationListDataDto {
  @ApiProperty({ type: [OrganizationDataDto] })
  items: OrganizationDataDto[];

  @ApiProperty({ type: OrganizationListMetaDto })
  meta: OrganizationListMetaDto;
}

export class OrganizationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: OrganizationDataDto })
  data: OrganizationDataDto;

  @ApiProperty({ example: '2026-07-24T00:00:00.000Z' })
  timestamp: string;
}

export class OrganizationListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: OrganizationListDataDto })
  data: OrganizationListDataDto;

  @ApiProperty({ example: '2026-07-24T00:00:00.000Z' })
  timestamp: string;
}
