import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      application: 'LMS Backend',

      version: '1.0.0',

      status: 'Running Successfully',
    };
  }
}