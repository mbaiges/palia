import { User } from '@/domain/models/User';
import { PublicUser } from '@/domain/models/PublicUser';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { PaginatedResult } from '@/domain/models/PaginatedResult';
import { SearchUsersParams } from '@/domain/models/SearchUsersParams';
import { SearchUsersWithRolesParams } from '@/domain/models/SearchUsersWithRolesParams';

/**
 * In-memory mock implementation of the UserRepository for testing purposes.
 * It allows us to test domain services without a real database connection.
 */
export class MockUserRepository implements UserRepository {
  private users: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async findPublicById(id: string): Promise<PublicUser | null> {
    const user = await this.findById(id);
    return user ? user.toPublicUser() : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.users.find(user => user.googleId === googleId) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async findPublicAll(): Promise<PublicUser[]> {
    return this.users.map(user => user.toPublicUser());
  }

  async searchUsers(params: SearchUsersParams): Promise<PaginatedResult<PublicUser>> {
    const { page, limit, searchQuery } = params;
    
    let filteredUsers = this.users.map(user => user.toPublicUser());
    
    if (searchQuery && searchQuery.trim()) {
      const searchLower = searchQuery.trim().toLowerCase();
      filteredUsers = filteredUsers.filter(
        user => 
          user.email.toLowerCase().includes(searchLower) ||
          user.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by email
    filteredUsers.sort((a, b) => a.email.localeCompare(b.email));
    
    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    const items = filteredUsers.slice(offset, offset + limit);
    
    return {
      items,
      totalItems,
      itemCount: items.length,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    };
  }

  async countUsers(searchQuery?: string): Promise<number> {
    if (!searchQuery || !searchQuery.trim()) {
      return this.users.length;
    }
    
    const searchLower = searchQuery.trim().toLowerCase();
    return this.users.filter(
      user =>
        user.email.toLowerCase().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower)
    ).length;
  }

  async save(user: User): Promise<User> {
    const existingIndex = this.users.findIndex(u => u.id === user.id);
    if (existingIndex > -1) {
      this.users[existingIndex] = user;
    } else {
      this.users.push(user);
    }
    return user;
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.users.length;
    this.users = this.users.filter(user => user.id !== id);
    return this.users.length < initialLength;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.users.some(user => user.email === email);
  }

  async existsByGoogleId(googleId: string): Promise<boolean> {
    return this.users.some(user => user.googleId === googleId);
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    // Mock implementation - in real tests, this would be mocked
    // This is just to satisfy the interface
  }

  async getUserRoles(userId: string): Promise<string[]> {
    // Mock implementation - in real tests, this would be mocked
    // This is just to satisfy the interface
    return [];
  }

  async replaceUserRole(userId: string, newRoleId: string): Promise<void> {
    // Mock implementation - in real tests, this would be mocked
    // This is just to satisfy the interface
  }

  async updateEmailVerified(userId: string, verified: boolean): Promise<void> {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      const updated = new User(
        user.id,
        user.googleId,
        user.email,
        user.name,
        user.profileImageId,
        user.avatarImageId,
        user.googleRefreshToken,
        user.googleScopes,
        user.passwordHash,
        verified,
        user.createdAt,
        new Date()
      );
      const idx = this.users.findIndex(u => u.id === userId);
      this.users[idx] = updated;
    }
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      const updated = new User(
        user.id,
        user.googleId,
        user.email,
        user.name,
        user.profileImageId,
        user.avatarImageId,
        user.googleRefreshToken,
        user.googleScopes,
        passwordHash,
        user.emailVerified,
        user.createdAt,
        new Date()
      );
      const idx = this.users.findIndex(u => u.id === userId);
      this.users[idx] = updated;
    }
  }

  async searchUsersWithRolesAndAllowed(
    params: SearchUsersWithRolesParams
  ): Promise<PaginatedResult<{
    email: string;
    userId: string | null;
    roleIds: string[];
    isAllowed: boolean;
    isRegistered: boolean;
  }>> {
    // Mock implementation - in real tests, this would be mocked
    // This is just to satisfy the interface
    return {
      items: [],
      totalItems: 0,
      itemCount: 0,
      itemsPerPage: params.limit,
      totalPages: 0,
      currentPage: params.page,
    };
  }

  // Helper method for tests to clear the data
  public clear(): void {
    this.users = [];
  }
}

