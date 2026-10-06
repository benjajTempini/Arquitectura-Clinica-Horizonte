import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = (request.headers['x-trace-id'] as string) || randomUUID();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message: string | object = 'Ha ocurrido un error inesperado en el servidor.';
    let details: any[] = [];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const errorObj = res as Record<string, any>;
        code = errorObj.code || (Array.isArray(errorObj.message) ? 'VALIDATION_ERROR' : this.getDefaultCodeForStatus(statusCode));
        if (Array.isArray(errorObj.message)) {
          details = errorObj.message;
          message = details.length > 0 ? details.join('. ') : 'Error de validación en la solicitud';
        } else if (errorObj.details) {
          details = Array.isArray(errorObj.details) ? errorObj.details : [errorObj.details];
          message = errorObj.message || exception.message;
        } else {
          message = errorObj.message || exception.message;
        }
      } else {
        message = res;
        code = this.getDefaultCodeForStatus(statusCode);
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Error no controlado: ${exception.message}`, exception.stack);
    }

    // Sanitizar logging: nunca loggear datos sensibles
    this.logger.warn(`[${request.method}] ${request.url} - Status ${statusCode} - Code: ${code} - TraceId: ${traceId}`);

    response.status(statusCode).json({
      statusCode,
      code,
      message,
      details,
      traceId,
    });
  }

  private getDefaultCodeForStatus(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'UNPROCESSABLE_ENTITY';
      default: return 'INTERNAL_SERVER_ERROR';
    }
  }
}
