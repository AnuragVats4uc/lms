import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRoles = new Set<string>(request.user?.roles ?? []);

    if (userRoles.has('SUPER_ADMIN')) {
      return true;
    }

    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.has(role),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
