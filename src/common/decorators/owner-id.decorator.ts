import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface User {
  sub: number;
}

export const OwnerId = createParamDecorator(
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    const user = (request as { user?: User }).user;
    return user?.sub ?? 0;
  },
);
