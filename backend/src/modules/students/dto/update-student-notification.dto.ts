import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateStudentNotificationDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isRead: boolean;
}
