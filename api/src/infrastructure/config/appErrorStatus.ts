import { AppError } from '@/domain/errors/AppError';
import { ErrorCode } from '@/domain/errors/ErrorCodes';

export function appErrorStatus(error: AppError): number {
  switch (error.errorCode) {
    case ErrorCode.NOT_FOUND:
      return 404;
    case ErrorCode.MEDIA_EXPIRED:
      return 410;
    case ErrorCode.FORBIDDEN:
    case ErrorCode.PERMISSION_REQUIRED:
    case ErrorCode.EMAIL_NOT_VERIFIED:
    case ErrorCode.ADMIN_EMAIL_NOT_ALLOWED:
      return 403;
    case ErrorCode.INVALID_CREDENTIALS:
      return 401;
    case ErrorCode.EMAIL_ALREADY_EXISTS:
    case ErrorCode.EMAIL_ALREADY_EXISTS_GOOGLE:
    case ErrorCode.ADMIN_EMAIL_ALREADY_ALLOWED:
      return 409;
    default:
      return 400;
  }
}
