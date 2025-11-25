import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import type { Request } from 'express';

@Injectable()
export class ErrorHandlingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const originalJson = res.json;
    res.json = function (body: unknown) {
      if (
        typeof body === 'object' &&
        body !== null &&
        'statusCode' in body &&
        (body as { statusCode: number }).statusCode === 500 &&
        'message' in body &&
        typeof (body as { message?: string }).message === 'string' &&
        ((body as { message: string }).message.includes('Unauthorized') ||
          (body as { message: string }).message.includes('Forbidden'))
      ) {
        res.status(401).json({
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized',
        });
        return res;
      }
      return originalJson.call(this, body);
    };
    next();
  }
}
