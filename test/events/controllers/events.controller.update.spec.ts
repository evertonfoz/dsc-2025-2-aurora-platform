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
  const service = { update: jest.fn() } as { update: jest.Mock };

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
    const updated: Partial<
      import('../../../src/events/entities/event.entity').Event
    > = makeEventEntity({
      id: 7,
      title: 'Updated Title',
    });
    service.update.mockResolvedValue(updated);

    const res = await controller.update(
      7,
      updateDto as unknown as Record<string, unknown>,
      7,
    );
    expect(service.update).toHaveBeenCalledWith(7, updateDto, {
      id: 7,
      isAdmin: false,
    });
    expectDtoMappedToEntity(
      { id: 7, title: 'Updated Title' } as unknown as Record<string, unknown>,
      res as unknown as Record<string, unknown>,
      ['id', 'title'],
    );
    expectNoSensitiveFields(res as unknown as Record<string, unknown>);
  });

  it('PATCH /events/:id → retorna undefined quando service retorna undefined (não lança)', async () => {
    service.update.mockResolvedValue(undefined);
    const res = await controller.update(
      '999' as unknown as number,
      {} as unknown as Record<string, unknown>,
      1,
    );
    // Note: when calling controller methods directly in unit tests, pipes (ParseIntPipe) are not applied.
    expect(service.update).toHaveBeenCalledWith(
      '999',
      {},
      { id: 1, isAdmin: false },
    );
    expect(res).toBeUndefined();
  });
});
