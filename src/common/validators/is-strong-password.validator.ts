import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsStrongPassword(options?: ValidationOptions) {
 return function (object: any, propertyName: string) {
    registerDecorator({
       name: 'IsStrongPassword',
       target: object.constructor,
       propertyName,
       options,
       validator: {
          validate(value: string) {
             if (typeof value !== 'string') return false;
 // Exemplo simples: 8+ chars, maiúscula, minúscula, número
             return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(value);
          },
          defaultMessage: () => 
            'Senha fraca: use 8+ chars, maiúsculas, minúsculas e números.'
          }
       });
    };
}