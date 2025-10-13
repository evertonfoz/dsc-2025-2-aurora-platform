import type { TransformFnParams } from 'class-transformer';

export function ToLowerTransform() {
  return (params: TransformFnParams): unknown => {
    const v = params.value;
    if (typeof v === 'string') return v.trim().toLowerCase();
    return v;
  };
}
