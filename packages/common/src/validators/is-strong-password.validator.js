"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsStrongPassword = IsStrongPassword;
const class_validator_1 = require("class-validator");
function IsStrongPassword(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isStrongPassword',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value) {
                    if (typeof value !== 'string')
                        return false;
                    return /(?=.{8,})(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/.test(value);
                },
                defaultMessage() {
                    return 'Senha muito fraca. Use ao menos 8 caracteres, maiúsculas, minúsculas e números.';
                },
            },
        });
    };
}
//# sourceMappingURL=is-strong-password.validator.js.map