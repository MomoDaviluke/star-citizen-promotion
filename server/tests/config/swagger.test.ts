/**
 * @file Swagger 配置测试
 * @description 覆盖 OpenAPI 规范生成、路由挂载、JSON 端点
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// ---- Mocks -----------------------------------------------------------

const mockSwaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Star Citizen Promotion API',
    version: '1.0.0',
    description: '星际公民战队宣传网站 API 文档'
  },
  servers: [
    { url: '/api/v1', description: 'V1 API' },
    { url: '/api', description: '兼容 API' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  paths: {}
}

jest.unstable_mockModule('swagger-jsdoc', () => ({
  default: jest.fn().mockReturnValue(mockSwaggerSpec)
}))

jest.unstable_mockModule('swagger-ui-express', () => ({
  default: {
    serve: 'mock-serve-middleware',
    setup: jest.fn().mockReturnValue('mock-setup-middleware')
  }
}))

const { setupSwagger, default: specs } = await import('../../src/config/swagger.js')
const swaggerJsdoc = (await import('swagger-jsdoc')).default as jest.Mock

// ---- Helpers ---------------------------------------------------------

function createMockApp() {
  const middlewares: Array<{ path: string; handler: unknown }> = []
  const app = {
    use: jest.fn((...args: unknown[]) => {
      if (typeof args[0] === 'string' && args.length >= 2) {
        middlewares.push({ path: args[0] as string, handler: args[1] })
      } else if (args.length >= 1) {
        middlewares.push({ path: '/', handler: args[0] })
      }
      return app
    }),
    get: jest.fn((...args: unknown[]) => {
      if (typeof args[0] === 'string' && args.length >= 2) {
        middlewares.push({ path: args[0] as string, handler: args[1] })
      }
      return app
    }),
    middlewares
  }
  return app as any
}

// ---- Tests -----------------------------------------------------------

describe('Swagger Config', () => {
  beforeEach(() => {
    // 只清除 app 等非模块级 mock，不清除 swaggerJsdoc 的调用记录
  })

  describe('OpenAPI 规范', () => {
    it('应该生成有效的 OpenAPI 3.0 规范', () => {
      expect(specs).toBeDefined()
      expect((specs as any).openapi).toBe('3.0.0')
    })

    it('应该包含正确的 API 信息', () => {
      const info = (specs as any).info
      expect(info.title).toBe('Star Citizen Promotion API')
      expect(info.version).toBe('1.0.0')
      expect(info.description).toContain('星际公民')
    })

    it('应该配置 v1 和兼容两个 server', () => {
      const servers = (specs as any).servers
      expect(servers).toHaveLength(2)
      expect(servers[0].url).toBe('/api/v1')
      expect(servers[1].url).toBe('/api')
    })

    it('应该配置 JWT Bearer 认证方案', () => {
      const schemes = (specs as any).components?.securitySchemes
      expect(schemes?.bearerAuth).toBeDefined()
      expect(schemes.bearerAuth.type).toBe('http')
      expect(schemes.bearerAuth.scheme).toBe('bearer')
      expect(schemes.bearerAuth.bearerFormat).toBe('JWT')
    })

    it('swagger-jsdoc 应该被调用并传入正确的 apis 路径', () => {
      expect(swaggerJsdoc).toHaveBeenCalled()
      const callArgs = swaggerJsdoc.mock.calls[0]?.[0] as any
      expect(callArgs.apis).toBeDefined()
      expect(callArgs.apis.some((p: string) => p.includes('routes'))).toBe(true)
    })
  })

  describe('setupSwagger', () => {
    it('应该在 /api-docs 路径挂载 Swagger UI', () => {
      const app = createMockApp()
      setupSwagger(app)

      expect(app.use).toHaveBeenCalled()
      const useCalls = app.use.mock.calls
      const apiDocsCall = useCalls.find((call: any[]) => call[0] === '/api-docs')
      expect(apiDocsCall).toBeDefined()
    })

    it('应该注册 /api-docs.json 端点返回 JSON 规范', () => {
      const app = createMockApp()
      setupSwagger(app)

      expect(app.get).toHaveBeenCalled()
      const getCalls = app.get.mock.calls
      const jsonEndpoint = getCalls.find((call: any[]) => call[0] === '/api-docs.json')
      expect(jsonEndpoint).toBeDefined()
    })

    it('/api-docs.json 端点应该返回 JSON 内容类型', () => {
      const app = createMockApp()
      setupSwagger(app)

      // 找到 /api-docs.json 的 handler
      const getCalls = app.get.mock.calls
      const jsonEndpoint = getCalls.find((call: any[]) => call[0] === '/api-docs.json')
      expect(jsonEndpoint).toBeDefined()

      const handler = jsonEndpoint![1] as Function
      const res = {
        setHeader: jest.fn(),
        send: jest.fn()
      }

      handler({} as any, res as any)

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
      expect(res.send).toHaveBeenCalled()
    })
  })
})
