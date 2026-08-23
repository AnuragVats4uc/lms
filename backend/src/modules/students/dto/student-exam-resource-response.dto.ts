import { ApiProperty } from '@nestjs/swagger';

export class StudentExamResourceResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: Object })
  data: Record<string, unknown>;
}
