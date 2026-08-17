import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || message;
        code = (exceptionResponse as any).error || code;
      }

      // Map 422 constraints
      if (status === 400 && Array.isArray(message)) {
          message = message.join(', ');
          code = 'VALIDATION_ERROR';
      } else if (status === 403) {
          code = 'UNAUTHORIZED_ROLE';
      } else if (status === 404) {
          code = 'NOT_FOUND';
      } else if (status === 409 || status === 422) {
          code = 'BUSINESS_RULE_VIOLATION';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      data: null,
      error: {
        code,
        message,
      },
    });
  }
}
