import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { StudentDashboardBannerMediaType } from '@prisma/client';

const APP_OR_WEB_URL = /^(?:\/(?!\/)[^\s]*|https?:\/\/[^\s]+)$/i;

export class DashboardBannerQueryDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  organizationId!: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  sessionId?: number;
}

export class CreateDashboardBannerDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ctaLabel?: string | null;

  @IsOptional()
  @Matches(APP_OR_WEB_URL)
  @MaxLength(1000)
  destinationUrl?: string | null;

  @IsEnum(StudentDashboardBannerMediaType)
  mediaType!: StudentDashboardBannerMediaType;

  @Matches(APP_OR_WEB_URL)
  @MaxLength(1000)
  mediaUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  mediaAlt?: string | null;

  @IsOptional()
  @Matches(APP_OR_WEB_URL)
  @MaxLength(1000)
  posterUrl?: string | null;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  sessionIds!: number[];

  @IsOptional()
  @IsBoolean()
  autoplay?: boolean;

  @IsOptional()
  @IsBoolean()
  openInNewTab?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsISO8601()
  startsAt?: string | null;

  @IsOptional()
  @IsISO8601()
  endsAt?: string | null;
}

export class UpdateDashboardBannerDto extends CreateDashboardBannerDto {}

export class ReorderDashboardBannersDto {
  @IsArray()
  @IsInt({ each: true })
  bannerIds!: number[];
}

export class DashboardBannerEventDto {
  @IsUUID()
  clientEventId!: string;

  @IsIn([
    'DASHBOARD_BANNER_IMPRESSION',
    'DASHBOARD_BANNER_CTA_CLICK',
    'DASHBOARD_BANNER_VIDEO_PLAY',
    'DASHBOARD_BANNER_VIDEO_PAUSE',
    'DASHBOARD_BANNER_VIDEO_COMPLETE',
  ])
  eventType!:
    | 'DASHBOARD_BANNER_IMPRESSION'
    | 'DASHBOARD_BANNER_CTA_CLICK'
    | 'DASHBOARD_BANNER_VIDEO_PLAY'
    | 'DASHBOARD_BANNER_VIDEO_PAUSE'
    | 'DASHBOARD_BANNER_VIDEO_COMPLETE';

  @IsOptional()
  @IsInt()
  @Min(0)
  videoPositionSeconds?: number;
}
