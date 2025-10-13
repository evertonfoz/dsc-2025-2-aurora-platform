import type { TransformFnParams } from 'class-transformer';

export function ToLowerTransform(): (params: TransformFnParams) => unknown {
  return (params: TransformFnParams) => {
    const v = params.value as unknown;
    if (typeof v === 'string') return v.trim().toLowerCase();
    return v;
  };
}
