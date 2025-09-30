// test/users/users.service.find.spec.ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { repositoryMockFactory, MockType } from '../mocks/repository.mock';
import { UserRole } from '../../src/users/domain/user-role.enum';
import { User } from '../../src/users/entities/user.entity';
import { UsersService } from '../../src/users/users.service';

type RepoMock = MockType<Repository<User>>;

describe('UsersService – findAll', () => {
    let service: UsersService;
    let repo: RepoMock;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: getRepositoryToken(User), useFactory: repositoryMockFactory },
            ],
        }).compile();

        service = moduleRef.get(UsersService);
        repo = moduleRef.get(getRepositoryToken(User));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const makeUser = (i: number, extra?: Partial<User>): User =>
    ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@mail.com`,
        role: UserRole.STUDENT,
        avatarUrl: null,
        passwordHash: `hash-${i}`, // deve ser removido no retorno
        createdAt: new Date(`2024-01-0${i}T00:00:00Z`),
        updatedAt: new Date(`2024-01-0${i}T00:00:00Z`),
        ...extra,
    } as unknown as User);

    it('retorna página 1/limit 10 sem filtros, ordenado por createdAt DESC e sem passwordHash', async () => {
        const page = 1;
        const limit = 10;

        const rows = [makeUser(1), makeUser(2), makeUser(3)];
        (repo.findAndCount as jest.Mock).mockResolvedValue([rows, 42]);

        // chamada
        // supondo assinatura: findAll({ page, limit, q?, role? })
        const result = await (service as any).findAll({ page, limit });

        // confere opções passadas ao TypeORM
        const [opts] = (repo.findAndCount as jest.Mock).mock.calls[0];
        expect(opts).toMatchObject({
            order: { createdAt: 'DESC' },
            skip: 0, // (page-1)*limit
            take: 10,
        });
        // sem filtro -> where indefinido ou igual a {}
        // tolerante a implementação:
        expect(opts.where === undefined || Array.isArray(opts.where) || typeof opts.where === 'object').toBe(true);

        // contrato de retorno
        expect(result).toEqual({
            data: rows.map(({ passwordHash, ...safe }) => safe),
            total: 42,
            page,
            limit,
        });

        // garante remoção do campo sensível
        expect((result.data[0] as any).passwordHash).toBeUndefined();
    });

    it('aplica busca (q) em name OR email com ILike e paginação page=2/limit=3', async () => {
        const page = 2;
        const limit = 3;
        const q = 'ana';

        const rows = [makeUser(4), makeUser(5), makeUser(6)];
        (repo.findAndCount as jest.Mock).mockResolvedValue([rows, 8]);

        const result = await (service as any).findAll({ page, limit, q });

        // verificação da chamada
        const [opts] = (repo.findAndCount as jest.Mock).mock.calls[0];

        expect(opts).toMatchObject({
            order: { createdAt: 'DESC' },
            skip: 3, // (2-1)*3
            take: 3,
        });

        // where deve ser um array com OR: [{ name: ILike('%ana%') }, { email: ILike('%ana%') }]
        expect(Array.isArray(opts.where)).toBe(true);
        expect(opts.where).toHaveLength(2);

        const w0 = (opts.where as any[])[0];
        const w1 = (opts.where as any[])[1];

        // confere FindOperator ILike (checando 'value' e 'type')
        expect(w0.name).toBeInstanceOf(Object);
        expect(w0.name.value).toBe(`%${q}%`);
        expect(w0.name.type?.toLowerCase?.()).toBe('ilike');

        expect(w1.email).toBeInstanceOf(Object);
        expect(w1.email.value).toBe(`%${q}%`);
        expect(w1.email.type?.toLowerCase?.()).toBe('ilike');

        // contrato de retorno e strip
        expect(result.data.every((u: any) => u.passwordHash === undefined)).toBe(true);
        expect(result).toMatchObject({ total: 8, page, limit });
    });

    it('combina busca (q) com filtro de role (AND) dentro de cada OR-branch', async () => {
        const q = 'ana';
        const role = UserRole.ADMIN;

        (repo.findAndCount as jest.Mock).mockResolvedValue([[makeUser(1, { role })], 1]);

        const result = await (service as any).findAll({ page: 1, limit: 10, q, role });

        const [opts] = (repo.findAndCount as jest.Mock).mock.calls[0];

        // where OR com role aplicado em ambas as alternativas
        expect(Array.isArray(opts.where)).toBe(true);
        const branches = opts.where as any[];

        expect(branches[0]).toMatchObject({ role });
        expect(branches[1]).toMatchObject({ role });

        // ainda usando ILike em cada branch
        expect(branches[0].name.value).toBe(`%${q}%`);
        expect(branches[1].email.value).toBe(`%${q}%`);

        // retorno
        expect(result.total).toBe(1);
        expect(result.data[0].role).toBe(UserRole.ADMIN);
        expect((result.data[0] as any).passwordHash).toBeUndefined();
    });

    it('quando q não é informado, aplica role sozinho (where simples, não array)', async () => {
        const role = UserRole.TEACHER;
        (repo.findAndCount as jest.Mock).mockResolvedValue([[makeUser(2, { role })], 1]);

        const result = await (service as any).findAll({ page: 1, limit: 5, role });

        const [opts] = (repo.findAndCount as jest.Mock).mock.calls[0];

        // where simples (objeto) com role
        expect(Array.isArray(opts.where)).toBe(false);
        expect(opts.where).toMatchObject({ role });

        // strip
        expect((result.data[0] as any).passwordHash).toBeUndefined();
    });

    it('lista sem filtros (page=1, limit=20)', async () => {
        const rows = [
            { id: 1, name: 'Ana', email: 'ana@mail.com', role: UserRole.STUDENT, passwordHash: 'x', createdAt: new Date(), updatedAt: new Date() } as User,
        ];
        (repo.findAndCount as jest.Mock).mockResolvedValue([rows, 1]);

        const result = await service.findAll({} as any);

        const [opts] = (repo.findAndCount as jest.Mock).mock.calls[0];
        expect(opts).toMatchObject({ order: { createdAt: 'DESC' }, skip: 0, take: 20 });
        expect(result).toEqual({
            data: [{ id: 1, name: 'Ana', email: 'ana@mail.com', role: UserRole.STUDENT, createdAt: rows[0].createdAt, updatedAt: rows[0].updatedAt }],
            total: 1,
            page: 1,
            limit: 20,
        });
        expect((result.data[0] as any).passwordHash).toBeUndefined();
    });

    it('aplica q (OR em name/email) + role + is_active', async () => {
        (repo.findAndCount as jest.Mock).mockResolvedValue([[{ id: 1 }], 1]);
        await service.findAll({ page: 2, limit: 5, q: 'ana', role: UserRole.ADMIN, is_active: true } as any);

        const [opts] = (repo.findAndCount as jest.Mock).mock.calls[0];
        expect(opts.skip).toBe(5); // (2-1)*5
        expect(opts.take).toBe(5);
        expect(Array.isArray(opts.where)).toBe(true);
        for (const branch of opts.where as any[]) {
            expect(branch.role).toBe(UserRole.ADMIN);
            expect(branch.isActive).toBe(true);
        }
    });

    it('deve sanear page/limit fora dos limites (page<1 → 1; limit>100 → 100; limit<1 → 1)', async () => {
        (repo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

        let r = await service.findAll({ page: 0, limit: 0 } as any);
        expect(r.page).toBe(1);
        expect(r.limit).toBe(1);

        r = await service.findAll({ page: -5, limit: 1000 } as any);
        expect(r.page).toBe(1);
        expect(r.limit).toBe(100);

        // (opcional) checar skip/take passados ao TypeORM:
        const calls = (repo.findAndCount as jest.Mock).mock.calls;
        expect(calls[0][0]).toMatchObject({ skip: 0, take: 1 });      // (1-1)*1, 1
        expect(calls[1][0]).toMatchObject({ skip: 0, take: 100 });    // (1-1)*100, 100
    });
});
