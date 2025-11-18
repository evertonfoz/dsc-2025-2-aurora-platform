import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return { status: 'ok' };
  }
}
