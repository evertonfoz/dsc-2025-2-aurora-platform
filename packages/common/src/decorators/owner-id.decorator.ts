import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OwnerId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  const user = req.user as any | undefined;
  if (!user) return undefined;
  return typeof user.sub === 'number' ? user.sub : user.id;
});
