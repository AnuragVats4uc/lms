import { ApiProperty } from '@nestjs/swagger';

export class StudentFolderResourcesResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: Object })
  data: Record<string, unknown>;
}
