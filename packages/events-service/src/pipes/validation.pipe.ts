// validation.pipe.ts (placeholder - original file was empty)
import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any) {
    return value;
  }
}
