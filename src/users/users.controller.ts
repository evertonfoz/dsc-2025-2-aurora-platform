import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  NotFoundException,
  Put,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ServiceTokenGuard } from '../common/guards/service-token.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OwnerId } from '../common/decorators/owner-id.decorator';
import type { Request } from 'express';
import { plainToInstance } from 'class-transformer';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ValidateUserDto } from './dto/validate-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UserRole } from './enums/user-role.enum';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  /*
   Example usage of Roles decorator and RolesGuard:
   import { UseGuards } from '@nestjs/common';
   import { Roles } from '../common/decorators/roles.decorator';
   import { RolesGuard } from '../common/guards/roles.guard';

   // @UseGuards(RolesGuard)
   // @Roles('admin')
   // @Delete(':id')
   // async adminRemove(@Param('id') id: string) { ... }
  */
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar parcialmente usuário',
    description: 'Atualiza parcialmente os dados de um usuário pelo ID.',
  })
  @ApiResponse({ description: 'Usuário atualizado.', type: UserResponseDto })
  @ApiResponse({ description: 'Payload ou ID inválido.' })
  @ApiResponse({ description: 'Usuário não encontrado.' })
  @Patch(':id')
  @UseGuards(ServiceTokenGuard, JwtAuthGuard, RolesGuard)
  async patch(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @OwnerId() requesterId: number,
    @Req() req?: Request,
  ): Promise<UserResponseDto> {
    interface JwtUser {
      id?: number;
      roles?: string[];
    }
    const authUser = req?.user as unknown as JwtUser | undefined;
    const authRoles = authUser?.roles;
    const isAdmin = Array.isArray(authRoles) && authRoles.includes('admin');
    const user =
      requesterId == null
        ? await this.users.update(Number(id), dto)
        : await this.users.update(Number(id), dto, {
            id: requesterId,
            isAdmin,
          });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar usuário (total)',
    description: 'Atualiza todos os dados de um usuário pelo ID.',
  })
  @ApiResponse({ description: 'Usuário atualizado.', type: UserResponseDto })
  @ApiResponse({ description: 'Payload ou ID inválido.' })
  @ApiResponse({ description: 'Usuário não encontrado.' })
  @Put(':id')
  @UseGuards(ServiceTokenGuard, JwtAuthGuard, RolesGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @OwnerId() requesterId: number,
    @Req() req?: Request,
  ): Promise<UserResponseDto> {
    interface JwtUser {
      id?: number;
      roles?: string[];
    }
    const authUser = req?.user as unknown as JwtUser | undefined;
    const authRoles = authUser?.roles;
    const isAdmin = Array.isArray(authRoles) && authRoles.includes('admin');
    const user =
      requesterId == null
        ? await this.users.update(Number(id), dto)
        : await this.users.update(Number(id), dto, {
            id: requesterId,
            isAdmin,
          });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Criar usuário',
    description:
      'Cria um usuário com name, email, password e role (opcional). Retorna o usuário sem o hash da senha.',
  })
  @ApiResponse({
    description: 'Usuário criado com sucesso.',
    type: UserResponseDto,
  })
  @ApiResponse({
    description: 'Payload inválido (validação do DTO).',
  })
  @ApiResponse({ description: 'E-mail já registrado.' })
  @ApiResponse({
    description: 'Não autenticado (se houver autenticação).',
  })
  @ApiResponse({
    description: 'Sem permissão (se houver autorização).',
  })
  @Post()
  @UseGuards(ServiceTokenGuard, JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.users.create(dto);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Post('validate')
  @UseGuards(ServiceTokenGuard)
  async validate(@Body() dto: ValidateUserDto) {
    const identity = await this.users.validateCredentials(
      dto.email,
      dto.password,
    );
    if (!identity) return null;
    return identity;
  }

  @Get()
  @ApiOperation({
    summary: 'Listar usuários (paginado e filtrado)',
    description:
      'Retorna usuários paginados. Filtros: `q` (busca em name/email, case-insensitive), `role` e `isActive`. Ordenado por `createdAt DESC`.',
  })
  @ApiResponse({
    description: 'Lista paginada de usuários.',
    type: PaginatedUsersResponseDto,
  })
  @ApiResponse({
    description: 'Parâmetros inválidos (validação do DTO).',
  })
  @ApiResponse({ description: 'Não autenticado (se aplicável).' })
  @ApiResponse({ description: 'Sem permissão (se aplicável).' })
  @Get()
  @UseGuards(ServiceTokenGuard, JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
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
  @ApiResponse({
    description: 'Usuário encontrado.',
    type: UserResponseDto,
  })
  @ApiResponse({ description: 'ID inválido.' })
  @ApiResponse({ description: 'Usuário não encontrado.' })
  @Get(':id')
  @UseGuards(ServiceTokenGuard, JwtAuthGuard, RolesGuard)
  async findOne(
    @Param('id') id: string,
    @OwnerId() requesterId: number,
    @Req() req?: Request,
  ): Promise<UserResponseDto> {
    interface JwtUser {
      id?: number;
      roles?: string[];
    }
    const authUser = req?.user as unknown as JwtUser | undefined;
    const authRoles = authUser?.roles;
    const isAdmin = Array.isArray(authRoles) && authRoles.includes('admin');
    const user =
      requesterId == null
        ? await this.users.findOne(Number(id))
        : await this.users.findOne(Number(id), {
            id: requesterId,
            isAdmin,
          });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
  @Delete(':id')
  @ApiOperation({
    summary: 'Remover (soft delete) usuário',
    description: 'Marca o usuário como inativo (soft delete) pelo ID.',
  })
  @ApiResponse({
    description: 'Usuário removido (inativado).',
    schema: { example: { success: true } },
  })
  @ApiResponse({ description: 'ID inválido.' })
  @ApiResponse({ description: 'Usuário não encontrado.' })
  @Delete(':id')
  @UseGuards(ServiceTokenGuard, JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async remove(
    @Param('id') id: string,
    @OwnerId() requesterId: number,
    @Req() req?: Request,
  ): Promise<{ success: boolean }> {
    interface JwtUser {
      id?: number;
      roles?: string[];
    }
    const authUser = req?.user as unknown as JwtUser | undefined;
    const authRoles = authUser?.roles;
    const isAdmin = Array.isArray(authRoles) && authRoles.includes('admin');
    const result =
      requesterId == null
        ? await this.users.remove(Number(id))
        : await this.users.remove(Number(id), { id: requesterId, isAdmin });
    if (!result) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return { success: true };
  }
}
