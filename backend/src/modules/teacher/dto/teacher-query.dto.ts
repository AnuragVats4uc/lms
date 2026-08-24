import { ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceStatus, SessionCourseStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class TeacherListQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 'Quantitative' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class TeacherCoursesQueryDto extends TeacherListQueryDto {
  @ApiPropertyOptional({ enum: SessionCourseStatus })
  @IsOptional()
  @IsEnum(SessionCourseStatus)
  status?: SessionCourseStatus;
}

export class TeacherResourcesQueryDto extends TeacherListQueryDto {
  @ApiPropertyOptional({ example: 21 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sessionCourseId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  resourceTypeId?: number;

  @ApiPropertyOptional({ enum: ResourceStatus })
  @IsOptional()
  @IsEnum(ResourceStatus)
  status?: ResourceStatus;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') return value;
    return value === true || value === 'true';
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class TeacherStudentsQueryDto extends TeacherListQueryDto {
  @ApiPropertyOptional({ example: 21 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sessionCourseId?: number;
}
