import { TransformFnParams } from 'class-transformer';

export function ToLowerCase() {
  return function (target: any, key: string) {
    // using plain decorator style that class-transformer recognizes via @Transform(fn)
    const transform = (params: TransformFnParams) => {
      const v = params.value;
      if (typeof v === 'string') return v.trim().toLowerCase();
      return v;
    };
    // store metadata so callers can use it explicitly via @Transform(ToLowerCase())
    Reflect.defineMetadata('toLowerCase', transform, target, key);
  };
}
