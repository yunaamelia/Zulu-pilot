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
    // Don't transform .js files in packages - they're ES modules
    '^.+\\.js$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          modules: 'auto', // Preserve ES modules as-is
        }],
      ],
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!open)',
    // Don't transform compiled .js files - we'll use TypeScript source via moduleNameMapper
    // But DO transform .ts files in packages
    'packages/.*/src/.*\\.js$',
    // Do NOT ignore .ts files - they need to be transformed
    '!packages/.*/src/.*\\.ts$',
  ],
  moduleNameMapper: {
    '^@zulu-pilot/adapter$': '<rootDir>/packages/adapter/src',
    '^@zulu-pilot/cli$': '<rootDir>/packages/cli/src',
    '^@zulu-pilot/core$': '<rootDir>/packages/core/src',
    '^@zulu-pilot/providers$': '<rootDir>/packages/providers/src',
    '^open$': '<rootDir>/tests/__mocks__/open.cjs',
    // Map old src/ relative paths - check both src/ and packages/core/src
    // Pattern: ../../../../src/core/... - these files are in root src/ directory
    '^(\\.{1,2}/)+src/(.*)\\.js$': '<rootDir>/src/$2.ts',
    // CRITICAL: Handle ../utils/ imports from packages/core/src BEFORE catch-all patterns
    // These must come BEFORE the catch-all pattern to be matched first
    '^(\\.{1,2}/utils/contextErrors)\\.js$': '<rootDir>/packages/core/src/utils/contextErrors.ts',
    '^(\\.{1,2}/utils/errors)\\.js$': '<rootDir>/packages/core/src/utils/errors.ts',
    '^(\\.{1,2}/utils/validators)\\.js$': '<rootDir>/packages/core/src/utils/validators.ts',
    // Handle ../auth/ imports
    '^(\\.{1,2}/auth/GoogleCloudAuth)\\.js$': '<rootDir>/src/core/auth/GoogleCloudAuth.ts',
    // Map absolute paths: packages/adapter/src/interfaces/IModelAdapter.js, packages/core/src/index.js
    '^packages/([^/]+)/src/(.*)\\.js$': '<rootDir>/packages/$1/src/$2.ts',
    // CRITICAL: Map index.js files specifically - they're entry points
    '^packages/([^/]+)/src/index\\.js$': '<rootDir>/packages/$1/src/index.ts',
    // Map relative imports through packages/ path
    '^(\\.{1,2}/.*packages/[^/]+/src/.*)\\.js$': '$1.ts',
    // Handle relative .js imports from our source files
    // Match imports within packages (e.g., ./interfaces/IModelAdapter.js)
    '^(\\.{1,2}/.*(interfaces|converters|errorHandlers|utils|tools|services|core|config|providers|adapter|cli)/.*)\\.js$': '$1.ts',
    // CRITICAL: Handle specific common single-level imports
    // Packages: ./ProviderRegistry.js, ./MultiProviderRouter.js
    '^(\\./(ProviderRegistry|MultiProviderRouter|GeminiCLIModelAdapter|OpenAIConverter|GoogleCloudConverter|GeminiConverter|ProviderErrorHandler|IModelAdapter))\\.js$': '$1.ts',
    // Src directory: ./FileContext.js, ./CodeChange.js, ./TokenEstimator.js, ./errors.js, ./validators.js
    '^(\\./(FileContext|CodeChange|CodeChangeParser|FilePatcher|TokenEstimator|ContextManager|errors|validators|GoogleCloudAuth))\\.[jt]s$': '$1.ts',
    // CRITICAL: Handle single-level relative imports in packages (same directory)
    // This catches: ./contextErrors.js from packages/core/src/utils/validators.ts
    // Pattern must match ./Something.js in packages directories
    '^(\\./contextErrors)\\.js$': '<rootDir>/packages/core/src/utils/contextErrors.ts',
    '^(\\./errors)\\.js$': '<rootDir>/packages/core/src/utils/errors.ts',
    '^(\\./validators)\\.js$': '<rootDir>/packages/core/src/utils/validators.ts',
    // Handle multi-level imports from src/: ../utils/errors.js, ../utils/validators.js
    '^(\\.{1,2}/(utils|tools|services)/(errors|validators))\\.[jt]s$': '$1/$2.ts',
    // Handle deeper paths: ./core/parser/CodeChange.js, ./core/context/FileContext.js
    '^(\\.{1,2}/(core|utils)/([^/]+)/([A-Za-z]+))\\.[jt]s$': '$1/$2/$3.ts',
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
