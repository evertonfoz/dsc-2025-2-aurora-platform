import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { ServiceTokenGuard } from '../guards/service-token.guard';

@Module({
  providers: [Reflector, RolesGuard, JwtStrategy, ServiceTokenGuard],
  exports: [Reflector, RolesGuard, JwtStrategy, ServiceTokenGuard],
})
export class CommonModule {}
