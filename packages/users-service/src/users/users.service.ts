import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  private users: Map<string, UserDto> = new Map();

  constructor() {
    // seed mocked users expected by auth-service
    const admin: UserDto = { id: '1', email: 'admin.user@example.com', name: 'Admin User' };
    const testUser: UserDto = { id: '2', email: 'test.user@example.com', name: 'Test User' };
    this.users.set(admin.id, admin);
    this.users.set(testUser.id, testUser);
  }

  create(createUserDto: CreateUserDto): UserDto {
    const user: UserDto = {
      id: Date.now().toString(),
      email: createUserDto.email,
      name: createUserDto.name,
    };
    this.users.set(user.id, user);
    return user;
  }

  findOne(id: string): UserDto {
    const user = this.users.get(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  validateCredentials(email: string, password: string): UserDto | null {
    // simple mocked credential checks (same as previous Express logic)
    if (email === 'test.user@example.com' && password === 'StrongP@ssw0rd') {
      return this.users.get('2')!;
    }
    if (email === 'admin.user@example.com' && password === 'AdminP@ss1') {
      return this.users.get('1')!;
    }
    return null;
  }
}
