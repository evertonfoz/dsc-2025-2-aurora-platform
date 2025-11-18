import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  private users: Map<string, UserDto> = new Map();

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
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }
}
