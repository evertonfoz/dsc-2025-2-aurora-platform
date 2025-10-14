// test/events.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';

import { AppModule } from '../src/app.module';

describe('Events (e2e)', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    server = app.getHttpServer() as unknown as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /events creates event in draft and returns slug', async () => {
    const response = await request(server)
      .post('/events')
      .send({
        title: 'Test Event',
        summary: 'Test Summary',
        description: 'Test Description',
        startsAt: '2025-12-01T10:00:00Z',
        endsAt: '2025-12-01T12:00:00Z',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('slug');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.state).toBe('draft');
  });

  it('GET /events does not list draft events', async () => {
    // First create a draft event
    await request(server)
      .post('/events')
      .send({
        title: 'Draft Event',
        summary: 'Draft Summary',
        description: 'Draft Description',
        startsAt: '2025-12-01T10:00:00Z',
        endsAt: '2025-12-01T12:00:00Z',
      })
      .expect(201);

    // Now GET /events should not include it
    const listResponse = await request(server).get('/events').expect(200);

    expect(listResponse.body.events).toEqual([]);
  });

  it('POST /events/:id/publish changes to published and GET /events lists it', async () => {
    // Create draft event
    const createResponse = await request(server)
      .post('/events')
      .send({
        title: 'Publish Event',
        summary: 'Publish Summary',
        description: 'Publish Description',
        startsAt: '2025-12-01T10:00:00Z',
        endsAt: '2025-12-01T12:00:00Z',
      })
      .expect(201);

    const eventId = createResponse.body.id;

    // Publish it
    await request(server).post(`/events/${eventId}/publish`).expect(200);

    // Now GET /events should list it
    const listResponse = await request(server).get('/events').expect(200);

    expect(listResponse.body.events).toHaveLength(1);
    expect(listResponse.body.events[0].id).toBe(eventId);
    expect(listResponse.body.events[0].state).toBe('published');
  });

  it('GET /events/:slug accessible when published', async () => {
    // Create and publish event
    const createResponse = await request(server)
      .post('/events')
      .send({
        title: 'Slug Event',
        summary: 'Slug Summary',
        description: 'Slug Description',
        startsAt: '2025-12-01T10:00:00Z',
        endsAt: '2025-12-01T12:00:00Z',
      })
      .expect(201);

    const eventId = createResponse.body.id;
    const eventSlug = createResponse.body.slug;

    // Publish
    await request(server).post(`/events/${eventId}/publish`).expect(200);

    // GET by slug
    const getResponse = await request(server)
      .get(`/events/${eventSlug}`)
      .expect(200);

    expect(getResponse.body.id).toBe(eventId);
    expect(getResponse.body.slug).toBe(eventSlug);
  });
});
