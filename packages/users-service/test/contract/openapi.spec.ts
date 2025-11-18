import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

describe('Contract: packages/users-service/openapi.yaml', () => {
  const specPath = path.join(__dirname, '..', '..', 'openapi.yaml');
  let spec: any;

  beforeAll(() => {
    const raw = fs.readFileSync(specPath, 'utf8');
    spec = YAML.parse(raw);
  });

  test('paths /users existe', () => {
    expect(spec.paths).toBeDefined();
    expect(spec.paths['/users']).toBeDefined();
  });

  test('POST /users definido', () => {
    expect(spec.paths['/users'].post).toBeDefined();
  });

  test('schemas CreateUser e User existem', () => {
    expect(spec.components).toBeDefined();
    expect(spec.components.schemas).toBeDefined();
    expect(spec.components.schemas.CreateUser).toBeDefined();
    expect(spec.components.schemas.User).toBeDefined();
  });

  test('POST /users requestBody referencia CreateUser (se aplicável)', () => {
    const post = spec.paths['/users'].post;
    const ref = post?.requestBody?.content?.['application/json']?.schema?.['$ref'];
    expect(ref || post.requestBody).toBeDefined();
    if (ref) {
      expect(ref).toMatch(/#\/components\/schemas\/CreateUser/);
    }
  });
});
