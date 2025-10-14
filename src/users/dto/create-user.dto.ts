import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
  Length,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsTrimmed } from '../../common/validators/is-trimmed.validator';
import { ToLowerTransform } from '../../common/validators/to-lowercase.transform';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ minLength: 2, maxLength: 120 })
  @IsString()
  @IsTrimmed()
  @Length(2, 120)
  name!: string;

  @ApiProperty({ format: 'email' })
  @Transform(ToLowerTransform())
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @IsStrongPassword() 
  password!: string;

  @ApiPropertyOptional({ enum: UserRole, enumName: 'UserRole' })
  @IsOptional()
  @IsEnum(UserRole, { message: 'role deve ser student | teacher | admin' })
  role?: UserRole;
}
