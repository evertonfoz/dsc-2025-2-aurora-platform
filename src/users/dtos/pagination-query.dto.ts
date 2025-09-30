import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UserRole } from '../domain/user-role.enum';

export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 20;

  @ApiPropertyOptional({ description: 'Busca textual' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ enum: UserRole, enumName: 'UserRole' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ type: Boolean, description: 'Filtra por ativo/inativo' })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    const v = String(value).toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(v)) return true;
    if (['false', '0', 'no', 'n'].includes(v)) return false;
    return value; // deixará falhar no @IsBoolean se vier inválido
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
