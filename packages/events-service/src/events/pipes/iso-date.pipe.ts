import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class IsoDatePipe implements PipeTransform<string, Date> {
  transform(value: string): Date {
    if (typeof value !== 'string') {
      throw new BadRequestException('Value must be a string');
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid ISO date string');
    }
    return date;
  }
}
