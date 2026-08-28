import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ActivityHeartbeatDto {
  @ApiProperty({
    description:
      'Whether the user is currently interacting with the application',
    example: true,
  })
  @IsBoolean()
  active: boolean;
}
