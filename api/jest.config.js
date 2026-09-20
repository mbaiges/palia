module.exports = {
  preset: 'ts-jest',
  testEnvironment: './jest.custom-environment.js',
  globalSetup: './jest.global-setup.js',
  globalTeardown: './jest.global-teardown.js',
  roots: ['<rootDir>/src'],
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleNameMapper: {
    '^@/infrastructure/config/database$': '<rootDir>/dist/infrastructure/config/database.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

