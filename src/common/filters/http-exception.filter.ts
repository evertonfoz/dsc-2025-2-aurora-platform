import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse &&
        typeof (exceptionResponse as Record<string, unknown>).message === 'string'
      ) {
        message = (exceptionResponse as Record<string, unknown>).message as string;
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exception.message === 'string' &&
        exception.message.length > 0
      ) {
        message = exception.message;
      }
      error = exception.name ?? 'HttpException';
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'status' in exception &&
      typeof (exception as Record<string, unknown>).status === 'number'
    ) {
      // Handle exceptions with status property (like some Passport errors)
      status = (exception as { status: number }).status;
      message =
        (typeof (exception as { message?: string }).message === 'string' &&
        (exception as { message?: string }).message)
          ? (exception as { message: string }).message
          : 'Error';
      error =
        (typeof (exception as { name?: string }).name === 'string' &&
        (exception as { name?: string }).name)
          ? (exception as { name: string }).name
          : 'Error';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
    });
  }
}
