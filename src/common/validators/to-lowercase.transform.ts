import { TransformFnParams } from 'class-transformer';

export function ToLowerTransform() {
  return (params: TransformFnParams) => {
    const v = params.value as unknown;
    if (typeof v === 'string') return v.trim().toLowerCase();
    return v as any;
  };
}
