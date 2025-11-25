import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        // Only wrap successful responses (skip if already wrapped or if data is null/undefined)
        if (!data || (typeof data === 'object' && 'data' in data)) {
          return data;
        }
        return { data };
      }),
    );
  }
}
