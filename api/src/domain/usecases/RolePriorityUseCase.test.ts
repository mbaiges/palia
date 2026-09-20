import { RolePriorityUseCase } from './RolePriorityUseCase';

describe('RolePriorityUseCase', () => {
  let useCase: RolePriorityUseCase;

  beforeEach(() => {
    useCase = new RolePriorityUseCase();
  });

  describe('getPrimaryRole', () => {
    it('should return null for empty array', () => {
      const result = useCase.getPrimaryRole([]);
      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      const result = useCase.getPrimaryRole(null as any);
      expect(result).toBeNull();
    });

    it('should return the role for single role', () => {
      const result = useCase.getPrimaryRole(['user']);
      expect(result).toBe('user');
    });

    it('should return admin when admin is present', () => {
      const result = useCase.getPrimaryRole(['user', 'admin', 'editor']);
      expect(result).toBe('admin');
    });

    it('should return editor when editor is present but not admin', () => {
      const result = useCase.getPrimaryRole(['user', 'editor']);
      expect(result).toBe('editor');
    });

    it('should return user when only user is present', () => {
      const result = useCase.getPrimaryRole(['user']);
      expect(result).toBe('user');
    });

    it('should prioritize admin over editor', () => {
      const result = useCase.getPrimaryRole(['editor', 'admin']);
      expect(result).toBe('admin');
    });

    it('should prioritize editor over user', () => {
      const result = useCase.getPrimaryRole(['user', 'editor']);
      expect(result).toBe('editor');
    });

    it('should handle case-insensitive role IDs', () => {
      const result = useCase.getPrimaryRole(['ADMIN', 'Editor', 'FREE']);
      expect(result).toBe('ADMIN'); // Returns original casing
    });

    it('should return first role if unknown roles have same priority', () => {
      const result = useCase.getPrimaryRole(['unknown1', 'unknown2']);
      expect(result).toBe('unknown1');
    });

    it('should handle mixed known and unknown roles', () => {
      const result = useCase.getPrimaryRole(['unknown', 'admin', 'other']);
      expect(result).toBe('admin');
    });
  });
});

