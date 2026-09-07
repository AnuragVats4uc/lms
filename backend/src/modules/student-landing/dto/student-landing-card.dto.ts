import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  Matches,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class StudentLandingCardQueryDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  organizationId!: number;
}

export class CreateStudentLandingCardDto {
  @IsString()
  @Length(1, 120)
  title!: string;

  @IsString()
  @Length(1, 500)
  description!: string;

  @IsString()
  @Length(1, 80)
  ctaLabel!: string;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(1000)
  destinationUrl!: string;

  @IsOptional()
  @Matches(/^(?:\/(?!\/)[^\s]*|https?:\/\/[^\s]+)$/i, {
    message: 'imageUrl must be an application path or an http(s) URL',
  })
  @MaxLength(1000)
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  imageAlt?: string | null;

  @IsOptional()
  @IsBoolean()
  openInNewTab?: boolean;
}

export class UpdateStudentLandingCardDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  ctaLabel?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(1000)
  destinationUrl?: string;

  @IsOptional()
  @Matches(/^(?:\/(?!\/)[^\s]*|https?:\/\/[^\s]+)$/i, {
    message: 'imageUrl must be an application path or an http(s) URL',
  })
  @MaxLength(1000)
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  imageAlt?: string | null;

  @IsOptional()
  @IsBoolean()
  openInNewTab?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ReorderStudentLandingCardsDto {
  @IsArray()
  @IsInt({ each: true })
  cardIds!: number[];
}

export class StudentLandingEventDto {
  @IsUUID()
  clientEventId!: string;
}
