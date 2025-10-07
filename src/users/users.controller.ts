  import { Body, Controller, Get, Post, Query, Param, NotFoundException, Put, Patch, Delete } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { PaginationQueryDto } from './dtos/pagination-query.dto';
import { UserRole } from './domain/user-role.enum';
import { PaginatedUsersResponseDto } from './dtos/paginated-users-response.dto';



@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar parcialmente usuário',
    description: 'Atualiza parcialmente os dados de um usuário pelo ID.',
  })
  @ApiOkResponse({ description: 'Usuário atualizado.', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Payload ou ID inválido.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  async patch(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.users.update(Number(id), dto);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }
  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar usuário (total)',
    description: 'Atualiza todos os dados de um usuário pelo ID.',
  })
  @ApiOkResponse({ description: 'Usuário atualizado.', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Payload ou ID inválido.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.users.update(Number(id), dto);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  @Post()
  @ApiOperation({
    summary: 'Criar usuário',
    description:
      'Cria um usuário com name, email, password e role (opcional). Retorna o usuário sem o hash da senha.',
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
  @ApiBadRequestResponse({
    description: 'Payload inválido (validação do DTO).',
  })
  @ApiConflictResponse({ description: 'E-mail já registrado.' })
  @ApiUnauthorizedResponse({
    description: 'Não autenticado (se houver autenticação).',
  })
  @ApiForbiddenResponse({
    description: 'Sem permissão (se houver autorização).',
  })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.users.create(dto);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Listar usuários (paginado e filtrado)',
    description:
      'Retorna usuários paginados. Filtros: `q` (busca em name/email, case-insensitive), `role` e `isActive`. Ordenado por `createdAt DESC`.',
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
    name: 'isActive',
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
  @ApiBadRequestResponse({
    description: 'Parâmetros inválidos (validação do DTO).',
  })
  @ApiUnauthorizedResponse({ description: 'Não autenticado (se aplicável).' })
  @ApiForbiddenResponse({ description: 'Sem permissão (se aplicável).' })
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedUsersResponseDto> {
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

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar usuário por ID',
    description: 'Retorna os dados de um usuário específico pelo ID.',
  })
  @ApiOkResponse({
    description: 'Usuário encontrado.',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'ID inválido.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.users.findOne(Number(id));
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }
  @Delete(':id')
  @ApiOperation({
    summary: 'Remover (soft delete) usuário',
    description: 'Marca o usuário como inativo (soft delete) pelo ID.',
  })
  @ApiOkResponse({ description: 'Usuário removido (inativado).', schema: { example: { success: true } } })
  @ApiBadRequestResponse({ description: 'ID inválido.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    const result = await this.users.remove(Number(id));
    if (!result) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return { success: true };
  }
}
