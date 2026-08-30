/**
 * @file Jest 配置
 * @description 测试框架配置 - 使用 ts-jest 进行 TypeScript 转换
 *              覆盖率使用 V8 provider 以兼容 ESM
 */

export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageProvider: 'v8',
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 60,
      statements: 60
    }
  },
  preset: 'ts-jest/presets/default-esm',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      diagnostics: false,
      tsconfig: {
        strict: false,
        noImplicitAny: false,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noImplicitReturns: false,
        module: 'esnext',
        moduleResolution: 'bundler'
      }
    }]
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  testTimeout: 15000,
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
}
