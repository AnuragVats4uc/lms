import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    type: String,
    description: 'Refresh token returned from login or refresh endpoint',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
