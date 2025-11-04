export function expectDtoMappedToEntity(
  dto: Record<string, unknown>,
  entity: Record<string, unknown>,
  keys?: string[],
) {
  const checkKeys = keys ?? Object.keys(dto);
  checkKeys.forEach((k) => {
    // use loose equality to avoid Date vs string mismatches in some cases
    expect(entity).toHaveProperty(k);
    // If dto has undefined, skip deep equality check
    if ((dto as any)[k] !== undefined) {
      expect((entity as any)[k]).toEqual((dto as any)[k]);
    }
  });
}

export function expectNoSensitiveFields(
  obj: Record<string, unknown>,
  fields: string[] = ['passwordHash'],
) {
  fields.forEach((f) => expect(obj).not.toHaveProperty(f));
}
