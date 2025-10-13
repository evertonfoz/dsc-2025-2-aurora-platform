import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsTrimmed(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isTrimmed',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          if (typeof value !== 'string') return true; // let other validators handle type
          return value === value.trim();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} should not have leading or trailing whitespace`;
        },
      },
    });
  };
}
