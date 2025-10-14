import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsTrimmed(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTrimmed',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return true; // let other validators handle type
          return value === value.trim();
        },
        defaultMessage(args: ValidationArguments) {
          // use args to avoid unused-variable lint
          return `${String(args.property)} não deve conter espaços em branco no início ou no fim`;
        },
      },
    });
  };
}
