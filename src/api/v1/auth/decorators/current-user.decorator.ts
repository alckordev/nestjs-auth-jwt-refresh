import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (field: string, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return field ? request.user[field] : request.user;
  },
);
