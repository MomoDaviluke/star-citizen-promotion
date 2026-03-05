/**
 * @file Jest 配置
 * @description 测试框架配置
 */

export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/index.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  verbose: true,
  testTimeout: 10000
}
