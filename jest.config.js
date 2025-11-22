export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node',
        target: 'ES2022',
        lib: ['ES2022'],
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
      },
      isolatedModules: false,
      diagnostics: {
        ignoreCodes: [1343], // Ignore import.meta errors in tests
      },
    }],
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!open)',
  ],
  moduleNameMapper: {
    '^@zulu-pilot/adapter$': '<rootDir>/packages/adapter/src',
    '^@zulu-pilot/cli$': '<rootDir>/packages/cli/src',
    '^@zulu-pilot/core$': '<rootDir>/packages/core/src',
    '^@zulu-pilot/providers$': '<rootDir>/packages/providers/src',
    '^open$': '<rootDir>/tests/__mocks__/open.cjs',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    'packages/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    // CLI entry points are tested via integration tests
    '!src/cli/index.ts',
    '!src/cli/commands/chat.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Critical paths require 95% coverage
    'src/core/llm/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    'src/core/parser/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    'src/core/context/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  testTimeout: 5000,
  verbose: true,
};
