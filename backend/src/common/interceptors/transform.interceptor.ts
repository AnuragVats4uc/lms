import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T = unknown> implements NestInterceptor<
  T,
  T | StreamableFile | SuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T | StreamableFile | SuccessResponse<T>> {
    return next.handle().pipe(
      map((data) =>
        data instanceof StreamableFile
          ? data
          : {
              success: true,
              message: 'Success',
              data,
              timestamp: new Date().toISOString(),
            },
      ),
    );
  }
}
