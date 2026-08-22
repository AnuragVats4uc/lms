import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class StudentCourseFolderCountsDto {
  @ApiProperty({ example: 8 })
  total: number;

  @ApiProperty({ example: 3 })
  videos: number;

  @ApiProperty({ example: 3 })
  documents: number;

  @ApiProperty({ example: 2 })
  exams: number;
}

class StudentCourseFolderItemDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 'Quantitative Aptitude' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  icon: string | null;

  @ApiPropertyOptional({ nullable: true })
  color: string | null;

  @ApiProperty({ type: StudentCourseFolderCountsDto })
  resourceCounts: StudentCourseFolderCountsDto;
}

export class StudentCourseFoldersResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: Object })
  data: {
    course: Record<string, unknown>;
    folders: StudentCourseFolderItemDto[];
  };
}
