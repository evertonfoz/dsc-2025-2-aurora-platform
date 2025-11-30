import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ToLower } from '@aurora/common';

export class LoginDto {
  @Transform(ToLower())
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
