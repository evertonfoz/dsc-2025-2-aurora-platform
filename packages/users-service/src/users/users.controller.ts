import { Body, Controller, Get, Param, Post, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ValidateUserDto } from './dto/validate-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';

@ApiTags('users')
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Post('users/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate credentials' })
  @ApiResponse({ status: 200, description: 'Valid credentials', type: UserDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  validate(@Body() dto: ValidateUserDto) {
    const user = this.usersService.validateCredentials(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201, description: 'User created', type: UserDto })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'User found', type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  getById(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
