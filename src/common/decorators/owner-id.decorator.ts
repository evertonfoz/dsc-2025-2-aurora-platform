import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface User {
  sub: number;
}

export const OwnerId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = (request as { user?: User }).user;
    return user?.sub ?? 0;
  },
);
