import { AppError } from '@/domain/errors/AppError';
import { ErrorCode } from '@/domain/errors/ErrorCodes';
import { appErrorStatus } from '@/infrastructure/config/appErrorStatus';

describe('appErrorStatus', () => {
  it.each([
    [ErrorCode.INVALID_INPUT, 400],
    [ErrorCode.NOT_FOUND, 404],
    [ErrorCode.MEDIA_EXPIRED, 410],
    [ErrorCode.FORBIDDEN, 403],
    [ErrorCode.PERMISSION_REQUIRED, 403],
    [ErrorCode.INVALID_CREDENTIALS, 401],
    [ErrorCode.EMAIL_ALREADY_EXISTS, 409],
  ])('maps %s to HTTP %i', (code, status) => {
    expect(appErrorStatus(new AppError('test error', code))).toBe(status);
  });
});
