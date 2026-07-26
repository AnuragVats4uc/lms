import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const roles = new Set<string>(user.roles ?? []);
    const permissions = new Set<string>(
      user.permissions ?? [],
    );

    if (roles.has('SUPER_ADMIN')) {
      return true;
    }

    const hasAllPermissions = requiredPermissions.every(
      (permission) => permissions.has(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
