import { ErrorCode } from '@/domain/errors/ErrorCodes';

export class AppError extends Error {
  public readonly errorCode: ErrorCode;

  constructor(message: string, errorCode: ErrorCode) {
    super(message);
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
