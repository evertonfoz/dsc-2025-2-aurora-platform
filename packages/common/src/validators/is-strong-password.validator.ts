import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          // require: min 8 chars, at least one upper, one lower, one number
          return /(?=.{8,})(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/.test(value);
        },
        defaultMessage() {
          return 'Senha muito fraca. Use ao menos 8 caracteres, maiúsculas, minúsculas e números.';
        },
      },
    });
  };
}
