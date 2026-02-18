export default {
  testEnvironment: 'node',
  transform: {},
  // ESM is inferred via package.json "type": "module"
  setupFiles: ['<rootDir>/tests/setup-env.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
};
