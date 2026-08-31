import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams, Type } from 'class-transformer';
import {
  IsEmail,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trimString = ({ value }: TransformFnParams): unknown => {
  const candidate: unknown = value;
  return typeof candidate === 'string' ? candidate.trim() : candidate;
};

const normalizeEmail = ({ value }: TransformFnParams): unknown => {
  const candidate: unknown = value;
  return typeof candidate === 'string'
    ? candidate.trim().toLowerCase()
    : candidate;
};

export class CreateStudentDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizationId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sessionId?: number;

  @ApiPropertyOptional({ example: [1, 2], type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  sessionCourseIds?: number[];

  @ApiPropertyOptional({ example: '6ff2a5a0-6637-4411-97ed-0e5ac642bba2' })
  @IsOptional()
  @IsUUID()
  educationOptionUuid?: string;

  @ApiPropertyOptional({ example: 'd95a1e3e-02bf-4c85-9d0e-812d64f08c25' })
  @IsOptional()
  @IsUUID()
  digitalLibraryLocationUuid?: string;

  @ApiProperty({ example: 'Rahul' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({ example: 'student@example.com' })
  @Transform(normalizeEmail)
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Student@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({ example: '+919999999999' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'ADM-2026-001' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  admissionNumber?: string;

  @ApiPropertyOptional({ example: 'IPMAT-001' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  rollNumber?: string;

  @ApiPropertyOptional({ example: '2005-04-12' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Female' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  gender?: string;

  @ApiPropertyOptional({ example: '+918888888888' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  alternatePhone?: string;

  @ApiPropertyOptional({ example: '123 Main Road' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Indore' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Madhya Pradesh' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: '452001' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'Raj Sharma' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  guardianName?: string;

  @ApiPropertyOptional({ example: '+917777777777' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  guardianPhone?: string;

  @ApiPropertyOptional({ example: 'Priya Sharma' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: '+916666666666' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  emergencyContactPhone?: string;
}
