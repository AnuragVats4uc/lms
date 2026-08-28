import { ApiProperty } from '@nestjs/swagger';

export class ActivityPolicyResponseDto {
  @ApiProperty() activityRetentionDays: number;
  @ApiProperty() failedLoginRetentionDays: number;
  @ApiProperty() idleThresholdSeconds: number;
  @ApiProperty() authHeartbeatSeconds: number;
  @ApiProperty() resourceHeartbeatSeconds: number;
  @ApiProperty() exportExpiryHours: number;
}

export class UserActivityHeartbeatResponseDto {
  @ApiProperty() sessionUuid: string;
  @ApiProperty() lastSeenAt: Date;
  @ApiProperty() elapsedDurationSeconds: number;
  @ApiProperty() activeDurationSeconds: number;
  @ApiProperty() idleDurationSeconds: number;
}
