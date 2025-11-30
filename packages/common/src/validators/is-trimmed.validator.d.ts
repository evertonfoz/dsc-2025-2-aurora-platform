import { ValidationOptions } from 'class-validator';
export declare function IsTrimmed(
  validationOptions?: ValidationOptions,
): (object: object, propertyName: string) => void;
