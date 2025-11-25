import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import type { Request } from 'express';

@Injectable()
export class ErrorHandlingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Intercept response to catch errors
    const originalJson = res.json;
    res.json = function (body: any) {
      // If statusCode is 500 but error is actually 401/403, fix it
      if (
        body?.statusCode === 500 &&
        (body?.message?.includes('Unauthorized') ||
          body?.message?.includes('Forbidden'))
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
