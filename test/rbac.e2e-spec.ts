import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { AppModule } from '../src/app.module';

// TestAuthGuard reads a header `x-test-user` with a JSON payload describing
// the test user to inject into request.user. This avoids modifying production
// guards and allows us to simulate different roles per request.
class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.get
      ? req.get('x-test-user')
      : req.headers?.['x-test-user'];
    if (!header) return false;
    try {
      req.user = JSON.parse(header as string);
      return true;
    } catch {
      return false;
    }
  }
}

describe('RBAC e2e (minimal)', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // apply our TestAuthGuard globally for the test app
    app.useGlobalGuards(new TestAuthGuard());
    await app.init();
    server = app.getHttpServer() as unknown as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('teacher can create event and ownerId is set', async () => {
    const teacher = { sub: 101, roles: ['teacher'] };
    const res = await request(server)
      .post('/events')
      .set('x-test-user', JSON.stringify(teacher))
      .send({
        title: 'E2E Test Event',
        description: 'desc',
        visibility: 'DRAFT',
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 3600000).toISOString(),
      })
      .expect(201);

    expect(res.body).toBeDefined();
    // ownerUserId should equal sub passed by our TestAuthGuard
    expect(res.body.ownerUserId).toBe(teacher.sub);
  });

  it('student can register to event and studentId is set', async () => {
    // create an event as teacher
    const teacher = { sub: 201, roles: ['teacher'] };
    const create = await request(server)
      .post('/events')
      .set('x-test-user', JSON.stringify(teacher))
      .send({
        title: 'Event for registration',
        description: 'desc',
        visibility: 'DRAFT',
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 3600000).toISOString(),
      })
      .expect(201);

    const eventId = create.body.id;
    const student = { sub: 301, roles: ['student'] };

    const reg = await request(server)
      .post(`/events/${eventId}/registrations`)
      .set('x-test-user', JSON.stringify(student))
      .send({})
      .expect(201);

    expect(reg.body).toBeDefined();
    expect(reg.body.studentId).toBe(student.sub);
  });
});
