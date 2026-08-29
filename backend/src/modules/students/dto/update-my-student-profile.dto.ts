import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trimNullableString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateMyStudentProfileDto {
  @ApiPropertyOptional({ example: 'Sam' })
  @Transform(({ value }: { value: unknown }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Student', nullable: true })
  @Transform(({ value }: { value: unknown }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string | null;

  @ApiPropertyOptional({ example: '2002-03-15', nullable: true })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | null;

  @ApiPropertyOptional({ example: 'Male', nullable: true })
  @Transform(({ value }: { value: unknown }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(30)
  gender?: string | null;

  @ApiPropertyOptional({ example: '+919876543211', nullable: true })
  @Transform(({ value }: { value: unknown }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(30)
  alternatePhone?: string | null;

  @ApiPropertyOptional({ example: '123 Main Road', nullable: true })
  @Transform(({ value }: { value: unknown }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  address?: string | null;

  @ApiPropertyOptional({ example: 'Bengaluru', nullable: true })
  @Transform(({ value }: { value: unknown }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @ApiPropertyOptional({ example: 'Karnataka', nullable: true })
  @Transform(({ value }: { value: unknown }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string | null;

  @ApiPropertyOptional({ example: '560001', nullable: true })
  @Transform(({ value }: { value: unknown }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string | null;

  @ApiPropertyOptional({ example: '/avatars/sam.png', nullable: true })
  @Transform(({ value }: { value: unknown }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(2_048)
  avatar?: string | null;

  @ApiPropertyOptional({ example: 'Ramesh Student', nullable: true })
  @Transform(({ value }: { value: unknown }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(150)
  guardianName?: string | null;

  @ApiPropertyOptional({ example: '+919123456789', nullable: true })
  @Transform(({ value }: { value: unknown }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(30)
  guardianPhone?: string | null;

  @ApiPropertyOptional({ example: 'Ramesh Student', nullable: true })
  @Transform(({ value }: { value: unknown }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(150)
  emergencyContactName?: string | null;

  @ApiPropertyOptional({ example: '+919988766554', nullable: true })
  @Transform(({ value }: { value: unknown }) => trimNullableString(value))
  @IsOptional()
  @IsString()
  @MaxLength(30)
  emergencyContactPhone?: string | null;
}
