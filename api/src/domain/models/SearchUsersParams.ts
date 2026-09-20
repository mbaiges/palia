/**
 * Search Users Parameters Model
 * Parameters for searching and paginating users
 */
export interface SearchUsersParams {
  page: number;
  limit: number;
  searchQuery?: string;
}

