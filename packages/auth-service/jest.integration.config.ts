import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  roots: ['<rootDir>/test'],
  moduleNameMapper: {
    '^@aurora/common$': '<rootDir>/../common/src',
    '^@aurora/common/(.*)$': '<rootDir>/../common/src/$1',
  },
  // Only run integration tests
  testMatch: ['**/integration/**/*.spec.ts'],
  testTimeout: 30000,
};

export default config;
