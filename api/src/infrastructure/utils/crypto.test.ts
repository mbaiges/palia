import { encrypt, decrypt } from './crypto';

describe('Crypto Utils', () => {

    beforeAll(() => {
        // Set a dummy encryption key for testing purposes
        process.env.ENCRYPTION_KEY = 'test-secret-key-12345';
    });

    it('should correctly encrypt a string', () => {
        // Arrange
        const originalText = 'my-secret-data';

        // Act
        const encryptedText = encrypt(originalText);

        // Assert
        expect(encryptedText).toBeDefined();
        expect(encryptedText).not.toBe(originalText);
    });

    it('should correctly decrypt a ciphertext back to the original string', () => {
        // Arrange
        const originalText = 'my-secret-data';
        const encryptedText = encrypt(originalText);

        // Act
        const decryptedText = decrypt(encryptedText);

        // Assert
        expect(decryptedText).toBe(originalText);
    });

    it('should return an empty string if decrypting an empty string', () => {
        // Arrange
        const encryptedEmpty = encrypt('');

        // Act
        const decryptedEmpty = decrypt(encryptedEmpty);

        // Assert
        expect(decryptedEmpty).toBe('');
    });
});

