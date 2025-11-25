"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnerId = void 0;
const common_1 = require("@nestjs/common");
exports.OwnerId = (0, common_1.createParamDecorator)((data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user)
        return undefined;
    return typeof user.sub === 'number' ? user.sub : user.id;
});
//# sourceMappingURL=owner-id.decorator.js.map