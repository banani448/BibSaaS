
/**
 * BibSaaS Premium
 * Jest Configuration
 */

module.exports = {
  testEnvironment: "node",

  roots: [
    "<rootDir>/src",
  ],

  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/?(*.)+(spec|test).ts",
  ],

  moduleFileExtensions: [
    "ts",
    "js",
    "json",
  ],

  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/node_modules/**",
    "!src/config/**",
    "!src/generated/**",
  ],

  coverageDirectory:
    "<rootDir>/coverage",

  coverageReporters: [
    "text",
    "text-summary",
    "lcov",
    "html",
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },

  clearMocks: true,

  restoreMocks: true,

  resetMocks: true,

  verbose: true,

  testTimeout: 30000,

  setupFilesAfterEnv: [
    "<rootDir>/src/tests/setup.ts",
  ],

  preset: "ts-jest",

  transform: {
    "^.+\\.ts$": "ts-jest",
  },

  moduleDirectories: [
    "node_modules",
    "<rootDir>",
  ],

  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/coverage/",
  ],
};

