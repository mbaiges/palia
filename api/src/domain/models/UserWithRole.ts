/**
 * User With Role Model
 * Represents a user with their role and allowed status
 */
export interface UserWithRole {
  email: string;
  userId: string | null; // User ID if registered, null if only in allowed_users
  isAllowed: boolean;
  isRegistered: boolean; // Whether the user has an account
  role: string | null; // Role name (e.g., 'user', 'editor', 'admin') or null if no role
}

