import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  private buildPayload() {
    return { status: 'ok' };
  }

  @Get('health')
  getHealth() {
    return this.buildPayload();
  }

  @Get('registrations/health')
  getRegistrationsHealth() {
    return this.buildPayload();
  }
}
