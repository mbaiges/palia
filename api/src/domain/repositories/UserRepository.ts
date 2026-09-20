import { User } from '@/domain/models/User';
import { PublicUser } from '@/domain/models/PublicUser';
import { PaginatedResult } from '@/domain/models/PaginatedResult';
import { SearchUsersParams } from '@/domain/models/SearchUsersParams';
import { SearchUsersWithRolesParams } from '@/domain/models/SearchUsersWithRolesParams';
import { UserWithRole } from '@/domain/models/UserWithRole';

/**
 * User Repository Interface
 * Defines the contract for user data persistence
 */
export interface UserRepository {
  /**
   * Find a user by their ID
   */
  findById(id: string): Promise<User | null>;
  /**
   * Find a user by their ID and return public data
   */
  findPublicById(id: string): Promise<PublicUser | null>;

  /**
   * Find a user by their Google ID
   */
  findByGoogleId(googleId: string): Promise<User | null>;

  /**
   * Find a user by their email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Get all users
   */
  findPublicAll(): Promise<PublicUser[]>;

  /**
   * Search and paginate users
   */
  searchUsers(params: SearchUsersParams): Promise<PaginatedResult<PublicUser>>;

  /**
   * Count users matching search query
   */
  countUsers(searchQuery?: string): Promise<number>;

  /**
   * Save a new user or update an existing one
   */
  save(user: User): Promise<User>;

  /**
   * Delete a user by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if a user exists by email
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Check if a user exists by Google ID
   */
  existsByGoogleId(googleId: string): Promise<boolean>;

  /**
   * Assign a role to a user
   */
  assignRole(userId: string, roleId: string): Promise<void>;

  /**
   * Get all roles for a user
   */
  getUserRoles(userId: string): Promise<string[]>;

  /**
   * Replace all roles for a user with a single new role
   */
  replaceUserRole(userId: string, newRoleId: string): Promise<void>;

  /**
   * Update email_verified status for a user
   */
  updateEmailVerified(userId: string, verified: boolean): Promise<void>;

  /**
   * Update password hash for a user (for password reset)
   */
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;

  /**
   * Search and paginate users with roles and allowed status
   * Combines registered users and unregistered allowed users
   * Returns users with their role IDs (to be resolved by service layer)
   */
  searchUsersWithRolesAndAllowed(params: SearchUsersWithRolesParams): Promise<PaginatedResult<{
    email: string;
    userId: string | null;
    roleIds: string[];
    isAllowed: boolean;
    isRegistered: boolean;
  }>>;
}
