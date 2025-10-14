import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OwnerId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as { sub: number } | undefined;
    return user?.sub ?? 0;
  },
);