import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

describe('OpenAPI contract - auth-service', () => {
  const specPath = path.join(__dirname, '..', '..', 'openapi.yaml');
  let spec: any;

  beforeAll(() => {
    const raw = fs.readFileSync(specPath, 'utf8');
    spec = YAML.parse(raw);
  });

  it('deve conter o path /auth/login com POST e schema de request', () => {
    expect(spec.paths).toBeDefined();
    const login = spec.paths['/auth/login'];
    expect(login).toBeDefined();
    expect(login.post).toBeDefined();

    const requestSchema = login.post.requestBody.content['application/json'].schema;
    expect(requestSchema.type).toBe('object');
    expect(requestSchema.required).toContain('email');
    expect(requestSchema.required).toContain('password');
  });

  it('deve conter o path /auth/refresh com POST e schema de request contendo refreshToken', () => {
    const refresh = spec.paths['/auth/refresh'];
    expect(refresh).toBeDefined();
    expect(refresh.post).toBeDefined();

    const requestSchema = refresh.post.requestBody.content['application/json'].schema;
    expect(requestSchema.type).toBe('object');
    expect(requestSchema.required).toContain('refreshToken');
  });
});
