import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRegistrationDto {
  @IsInt()
  @IsNotEmpty()
  eventId!: number;

  @IsString()
  @IsOptional()
  origin?: string;
}
