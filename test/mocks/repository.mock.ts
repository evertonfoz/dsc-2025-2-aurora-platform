// test/mocks/repository.mock.ts
import { Repository, ObjectLiteral } from 'typeorm';

// Mapeia cada método do tipo T para um jest.Mock
export type MockType<T> = {
  [P in keyof T]: jest.Mock<unknown, unknown[]>;
};

// Fábrica de mock para Repository<Entity>
export const repositoryMockFactory: <
  Entity extends ObjectLiteral = ObjectLiteral,
>() => MockType<Repository<Entity>> = () =>
  ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),

    // adicione outros que seu service usar (ex.: delete, softDelete, etc.)
  }) as unknown as MockType<Repository<ObjectLiteral>>;
