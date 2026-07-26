import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  hash(password: string) {
    const saltRounds =
      this.configService.get<number>('bcrypt.saltRounds') ?? 10;

    return bcrypt.hash(password, saltRounds);
  }

  compare(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}
