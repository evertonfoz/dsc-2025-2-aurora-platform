import { Test } from '@nestjs/testing';
import { EventsController } from '../../../src/events/events.controller';
import { EventsService } from '../../../src/events/events.service';
import { makeEventEntity } from '../../factories/event.factory';
import {
  expectDtoMappedToEntity,
  expectNoSensitiveFields,
} from '../../utils/asserts';

describe('EventsController – update', () => {
  let controller: EventsController;
  const service = { update: jest.fn() } as any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: service }],
    }).compile();
    controller = moduleRef.get(EventsController);
    jest.clearAllMocks();
  });

  it('PATCH /events/:id → delega ao service.update e retorna evento atualizado', async () => {
    const updateDto = { title: 'Updated Title' };
    const updated = makeEventEntity({
      id: 7,
      title: 'Updated Title',
    } as any) as any;
    service.update.mockResolvedValue(updated);

    const res = await controller.update(7 as any, updateDto as any, 7 as any);
    expect(service.update).toHaveBeenCalledWith(7, updateDto, {
      id: 7,
      isAdmin: false,
    });
    expectDtoMappedToEntity(
      { id: 7, title: 'Updated Title' } as any,
      res as any,
      ['id', 'title'],
    );
    expectNoSensitiveFields(res as any);
  });

  it('PATCH /events/:id → retorna undefined quando service retorna undefined (não lança)', async () => {
    service.update.mockResolvedValue(undefined);
    const res = await controller.update('999' as any, {} as any, 1 as any);
    // Note: when calling controller methods directly in unit tests, pipes (ParseIntPipe) are not applied.
    expect(service.update).toHaveBeenCalledWith(
      '999',
      {},
      { id: 1, isAdmin: false },
    );
    expect(res).toBeUndefined();
  });
});
