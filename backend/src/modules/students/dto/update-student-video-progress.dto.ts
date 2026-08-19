import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateStudentVideoProgressDto {
  @ApiProperty({ example: 482, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  currentPositionSeconds: number;

  @ApiPropertyOptional({
    description: 'True only when the media player emitted its ended event.',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  ended?: boolean;
}
