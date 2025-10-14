import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface User {
  sub: number;
}

export const OwnerId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User | undefined;
    return user?.sub ?? 0;
  },
);