/**
 * Password hashing interface
 * Abstracts password hashing for testability
 */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}
