import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class DenyImpersonationGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (request.user?.impersonation) {
      throw new ForbiddenException(
        'This action is not allowed during impersonation',
      );
    }

    return true;
  }
}
