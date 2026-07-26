import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RolesService } from '../../roles/services/roles.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService)
    configService: ConfigService,
    @Inject(RolesService)
    private readonly rolesService: RolesService,
  ) {
    const accessSecret = configService.get<string>('jwt.accessSecret');

    if (!accessSecret) {
      throw new Error('JWT access secret is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: accessSecret,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const accessContext =
      await this.rolesService.getUserAccessContext(payload.sub);
    const roles = accessContext.roles.length
      ? accessContext.roles
      : payload.roles ?? [];
    const permissions = accessContext.permissions.length
      ? accessContext.permissions
      : [];

    return {
      userId: payload.sub,
      email: payload.email,
      organizationId: payload.organizationId,
      roles,
      permissions,
    };
  }
}
