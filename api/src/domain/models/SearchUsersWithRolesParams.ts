import { SearchUsersParams } from './SearchUsersParams';

/**
 * Search Users With Roles Parameters Model
 * Parameters for searching and paginating users with role information
 */
export interface SearchUsersWithRolesParams extends SearchUsersParams {
  includeAllowedUsers?: boolean; // Whether to include unregistered allowed users
}

