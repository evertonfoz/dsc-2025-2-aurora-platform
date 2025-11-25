import { TransformFnParams } from 'class-transformer';

export function ToLower() {
  return (params: TransformFnParams) => {
    if (typeof params.value === 'string') return params.value.toLowerCase();
    return params.value;
  };
}
