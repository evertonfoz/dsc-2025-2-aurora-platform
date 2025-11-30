import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Patch,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ValidateUserDto } from './dto/validate-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';
import { RolesGuard, Roles, OwnerId, ServiceAndJwtGuard, ServiceTokenGuard } from '@aurora/common';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ServiceTokenGuard)
  @ApiOperation({ summary: 'Validate credentials (internal - service-to-service only)' })
  @ApiResponse({ status: 200, description: 'Valid credentials', type: UserDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  validate(@Body() dto: ValidateUserDto) {
    const user = this.usersService.validateCredentials(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  @Post()
  @UseGuards(ServiceAndJwtGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201, description: 'User created', type: UserDto })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @UseGuards(ServiceAndJwtGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'List users with pagination & filters' })
  list(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('q') q?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 10, 100);
    const filters = { q, role, isActive: isActive === undefined ? undefined : isActive === 'true' };
    return this.usersService.list({ page: pageNum, limit: limitNum, filters });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @UseGuards(ServiceAndJwtGuard, RolesGuard)
  update(@Param('id') id: string, @Body() dto: any, @OwnerId() requesterId?: number, @Req() req?: any) {
    const authUser = req?.user as unknown as { roles?: string[] } | undefined;
    const isAdmin = Array.isArray(authUser?.roles) && authUser!.roles!.includes('admin');
    return this.usersService.update(id, dto, requesterId == null ? undefined : { id: requesterId, isAdmin });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @UseGuards(ServiceAndJwtGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/last-logout')
  @ApiOperation({ summary: 'Set last logout timestamp for user' })
  @UseGuards(ServiceAndJwtGuard, RolesGuard)
  async setLastLogout(@Param('id') id: string) {
    // set it to now
    return this.usersService.setLastLogoutAt(id, new Date());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'User found', type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(ServiceAndJwtGuard, RolesGuard)
  async getById(@Param('id') id: string, @OwnerId() requesterId?: number, @Req() req?: any) {
    const authUser = req?.user as unknown as { roles?: string[] } | undefined;
    const isAdmin = Array.isArray(authUser?.roles) && authUser!.roles!.includes('admin');
    return this.usersService.findOne(id, requesterId == null ? undefined : { id: requesterId, isAdmin });
  }

  // NOTE: internal unauthenticated endpoint removed. Service-to-service calls
  // should use a service token validated by ServiceTokenGuard for security.
}
