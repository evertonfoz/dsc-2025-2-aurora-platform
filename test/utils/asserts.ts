export function expectDtoMappedToEntity(dto: Record<string, any>, entity: Record<string, any>, keys?: string[]) {
  const checkKeys = keys ?? Object.keys(dto);
  checkKeys.forEach((k) => {
    // use loose equality to avoid Date vs string mismatches in some cases
    expect(entity).toHaveProperty(k);
    // If dto has undefined, skip deep equality check
    if (dto[k] !== undefined) {
      expect(entity[k]).toEqual(dto[k]);
    }
  });
}

export function expectNoSensitiveFields(obj: Record<string, any>, fields: string[] = ['passwordHash']) {
  fields.forEach((f) => expect(obj).not.toHaveProperty(f));
}
