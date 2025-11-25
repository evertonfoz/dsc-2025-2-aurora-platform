"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsTrimmed = IsTrimmed;
const class_validator_1 = require("class-validator");
function IsTrimmed(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isTrimmed',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value) {
                    if (typeof value !== 'string')
                        return true;
                    return value === value.trim();
                },
                defaultMessage(args) {
                    return `${String(args.property)} não deve conter espaços em branco no início ou no fim`;
                },
            },
        });
    };
}
//# sourceMappingURL=is-trimmed.validator.js.map