import type {Config} from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  roots: ['<rootDir>/test'],
  moduleNameMapper: {
    '^@aurora/common$': '<rootDir>/../common/src',
    '^@aurora/common/(.*)$': '<rootDir>/../common/src/$1',
  },
  // Exclude integration tests by default (they require DB)
  // Run with: npm test -- --testPathPattern=integration
  testPathIgnorePatterns: ['/node_modules/', '/integration/'],
};

export default config;
