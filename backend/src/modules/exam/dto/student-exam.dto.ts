import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SaveStudentExamAnswerDto {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  selectedOptionIds?: number[];

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  textAnswer?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  numericAnswer?: number | null;

  @IsOptional()
  @IsBoolean()
  markedForReview?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(300)
  timeSpentSeconds?: number;
}

export class UpdateStudentExamProgressDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  attemptQuestionId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(300)
  timeSpentSeconds?: number;
}
