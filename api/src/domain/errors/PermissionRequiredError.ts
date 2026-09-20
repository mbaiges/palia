import { AppError } from './AppError';
import { ErrorCode } from './ErrorCodes';

/**
 * Permission Required Error
 * Thrown when a user lacks the required permission to perform an action
 */
export class PermissionRequiredError extends AppError {
  constructor(permissionId: string, message?: string) {
    super(
      message || `Permission '${permissionId}' is required`,
      ErrorCode.PERMISSION_REQUIRED
    );
    Object.setPrototypeOf(this, PermissionRequiredError.prototype);
  }
}

