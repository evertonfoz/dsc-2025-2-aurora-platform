import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UsersService } from './users.service';
import { ApiBadRequestResponse, ApiBody, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UserResponseDto } from './dtos/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationQueryDto } from './dtos/pagination-query.dto';
import { UserRole } from './domain/user-role.enum';
import { PaginatedUsersResponseDto } from './dtos/paginated-users-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly users: UsersService) { }

    @Post()
    @ApiOperation({
        summary: 'Criar usuário',
        description: 'Cria um usuário com name, email, password e role (opcional). Retorna o usuário sem o hash da senha.',
    })
    @ApiBody({
        type: CreateUserDto,
        examples: {
            exemploBasico: {
                summary: 'Exemplo completo',
                value: {
                    name: 'Ada Lovelace',
                    email: 'ada@example.com',
                    password: 's3nh@-forte',
                    role: 'teacher',
                },
            },
        },
    })
    @ApiCreatedResponse({
        description: 'Usuário criado com sucesso.',
        type: UserResponseDto,
    })
    @ApiBadRequestResponse({ description: 'Payload inválido (validação do DTO).' })
    @ApiConflictResponse({ description: 'E-mail já registrado.' })
    @ApiUnauthorizedResponse({ description: 'Não autenticado (se houver autenticação).' })
    @ApiForbiddenResponse({ description: 'Sem permissão (se houver autorização).' })
    async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
        const user = await this.users.create(dto);
        return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
    }

    @Get()
    @ApiOperation({
        summary: 'Listar usuários (paginado e filtrado)',
        description:
            'Retorna usuários paginados. Filtros: `q` (busca em name/email, case-insensitive), `role` e `is_active`. Ordenado por `createdAt DESC`.',
    })
    @ApiQuery({
        name: 'q',
        required: false,
        description: 'Busca textual (aplica OR em name e email, ILIKE)',
        example: 'ana',
    })
    @ApiQuery({
        name: 'role',
        required: false,
        description: 'Filtra por papel',
        enum: UserRole,
        example: UserRole.TEACHER,
    })
    @ApiQuery({
        name: 'is_active',
        required: false,
        description: 'Filtra por status ativo',
        type: Boolean,
        example: true,
    })
    @ApiQuery({
        name: 'page',
        required: false,
        description: 'Página (>= 1). Default: 1',
        type: Number,
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Itens por página. Default: 20 (faixa recomendada: 1..100)',
        type: Number,
        example: 20,
    })
    @ApiOkResponse({
        description: 'Lista paginada de usuários.',
        type: PaginatedUsersResponseDto,
    })
    @ApiBadRequestResponse({ description: 'Parâmetros inválidos (validação do DTO).' })
    @ApiUnauthorizedResponse({ description: 'Não autenticado (se aplicável).' })
    @ApiForbiddenResponse({ description: 'Sem permissão (se aplicável).' })
    async findAll(@Query() query: PaginationQueryDto): Promise<PaginatedUsersResponseDto> {
        const { data, total, page, limit } = await this.users.findAll(query);
        return {
            data: data.map((u) =>
                plainToInstance(UserResponseDto, u, { excludeExtraneousValues: true }),
            ),
            total,
            page,
            limit,
        };
    }


    // @Get(':id')
    // findOne(@Param('id', ParseIntPipe) id: number) {
    //     return this.users.findOne(id);
    // }

    // @Patch(':id')
    // update(
    //     @Param('id', ParseIntPipe) id: number,
    //     @Body() dto: UpdateUserDto,
    // ) {
    //     return this.users.update(id, dto);
    // }

    // @Delete(':id')
    // remove(@Param('id', ParseIntPipe) id: number) {
    //     return this.users.remove(id);
    // }
}