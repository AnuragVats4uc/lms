import { Module } from '@nestjs/common';
import { StudentProfileController } from './student-profile.controller';
import { StudentProfileService } from './student-profile.service';

@Module({
  controllers: [StudentProfileController],
  providers: [StudentProfileService]
})
export class StudentProfileModule {}
