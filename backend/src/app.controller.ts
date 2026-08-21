import { Controller, Get } from '@nestjs/common';

import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';
import { Public } from './modules/auth/decorators/public.decorators';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Check API Health',
  })
  getHello() {
    return this.appService.getHello();
  }
}
