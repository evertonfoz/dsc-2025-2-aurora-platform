import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsStrongPassword(options?: ValidationOptions) {
  // object must have a constructor property (the target class constructor)
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsStrongPassword',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        // accept unknown and narrow to string
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          // Exemplo simples: 8+ chars, maiúscula, minúscula, número
          return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(value);
        },
        defaultMessage: () =>
          'Senha fraca: use 8+ chars, maiúsculas, minúsculas e números.',
      },
    });
  };
}
