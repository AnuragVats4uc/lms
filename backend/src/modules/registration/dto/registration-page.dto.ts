import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const registrationFieldTypes = [
  'TEXT',
  'SELECT',
  'RADIO',
  'TEXTAREA',
] as const;

export const registrationPageStatuses = [
  'DRAFT',
  'ACTIVE',
  'ARCHIVED',
] as const;

const trimString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : value;

const trimLowerString = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const trimUpperString = (value: unknown) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class RegistrationFieldOptionDto {
  @ApiProperty({ example: 'GRADUATE' })
  @Transform(({ value }: { value: unknown }) => trimUpperString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  optionKey: string;

  @ApiProperty({ example: 'Graduate' })
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  label: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RegistrationFieldDto {
  @ApiProperty({ example: 'education' })
  @Transform(({ value }: { value: unknown }) => trimLowerString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(/^[a-z0-9_]+$/)
  fieldKey: string;

  @ApiProperty({ example: 'Education' })
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  label: string;

  @ApiProperty({ example: 'SELECT', enum: registrationFieldTypes })
  @IsIn(registrationFieldTypes)
  fieldType: (typeof registrationFieldTypes)[number];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ example: 'Choose an option' })
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(180)
  placeholder?: string;

  @ApiPropertyOptional({ example: 'Highest completed education' })
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  helpText?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [RegistrationFieldOptionDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => RegistrationFieldOptionDto)
  options?: RegistrationFieldOptionDto[];
}

export class CreateRegistrationPageDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sessionId: number;

  @ApiProperty({ example: 'keonjhar-library' })
  @Transform(({ value }: { value: unknown }) => trimLowerString(value))
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug: string;

  @ApiPropertyOptional({ example: 'Student Registration' })
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @ApiPropertyOptional({ example: 'Register for this session.' })
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoOverride?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  heroImage?: string;

  @ApiPropertyOptional({ example: '#059669' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#2563EB' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  accentColor?: string;

  @ApiPropertyOptional({ example: 'support@example.com' })
  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @ApiPropertyOptional({ example: '+919999999999' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  supportPhone?: string;

  @ApiPropertyOptional({ example: 'Register Now' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  submitButtonText?: string;

  @ApiPropertyOptional({ example: 'Registration Successful' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  successTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  successMessage?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  registrationEnabled?: boolean;

  @ApiPropertyOptional({ example: 'DRAFT', enum: registrationPageStatuses })
  @IsOptional()
  @IsIn(registrationPageStatuses)
  status?: (typeof registrationPageStatuses)[number];

  @ApiPropertyOptional({ type: [RegistrationFieldDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => RegistrationFieldDto)
  fields?: RegistrationFieldDto[];

  @ApiPropertyOptional({
    example: ['e2578b4d-9be3-43a8-9a36-53330f29ea5f'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  selectedSessionCourseUuids?: string[];

  @ApiPropertyOptional({
    example: ['e2578b4d-9be3-43a8-9a36-53330f29ea5f'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  selectedEducationOptionUuids?: string[];

  @ApiPropertyOptional({
    example: ['e2578b4d-9be3-43a8-9a36-53330f29ea5f'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  selectedDigitalLibraryLocationUuids?: string[];
}

export class UpdateRegistrationPageDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sessionId?: number;

  @ApiPropertyOptional({ example: 'keonjhar-library' })
  @Transform(({ value }: { value: unknown }) => trimLowerString(value))
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoOverride?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  heroImage?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  primaryColor?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  accentColor?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  supportEmail?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  supportPhone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  submitButtonText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  successTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  successMessage?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  registrationEnabled?: boolean;

  @ApiPropertyOptional({ enum: registrationPageStatuses })
  @IsOptional()
  @IsIn(registrationPageStatuses)
  status?: (typeof registrationPageStatuses)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [RegistrationFieldDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => RegistrationFieldDto)
  fields?: RegistrationFieldDto[];

  @ApiPropertyOptional({
    example: ['e2578b4d-9be3-43a8-9a36-53330f29ea5f'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  selectedSessionCourseUuids?: string[];

  @ApiPropertyOptional({
    example: ['e2578b4d-9be3-43a8-9a36-53330f29ea5f'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  selectedEducationOptionUuids?: string[];

  @ApiPropertyOptional({
    example: ['e2578b4d-9be3-43a8-9a36-53330f29ea5f'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  selectedDigitalLibraryLocationUuids?: string[];
}

export class PublicRegistrationSubmitDto {
  @ApiProperty({ example: 'Rahul' })
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiPropertyOptional({ example: 'Kumar' })
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({ example: 'MALE' })
  @Transform(({ value }: { value: unknown }) => trimUpperString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  gender: string;

  @ApiProperty({ example: '2007-05-15' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: '9876543210' })
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string;

  @ApiProperty({ example: 'rahul@example.com' })
  @Transform(({ value }: { value: unknown }) => trimLowerString(value))
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Student@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({ example: { education: 'GRADUATE' } })
  @IsOptional()
  @IsObject()
  customAnswers?: Record<string, string>;

  @ApiProperty({ example: 'e2578b4d-9be3-43a8-9a36-53330f29ea5f' })
  @IsUUID()
  educationOptionUuid: string;

  @ApiProperty({ example: 'e2578b4d-9be3-43a8-9a36-53330f29ea5f' })
  @IsUUID()
  digitalLibraryLocationUuid: string;

  @ApiProperty({ example: ['e2578b4d-9be3-43a8-9a36-53330f29ea5f'] })
  @IsArray()
  @ArrayMaxSize(30)
  @IsUUID('4', { each: true })
  selectedSessionCourseUuids: string[];
}
