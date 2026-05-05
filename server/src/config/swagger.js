/**
 * @file Swagger 配置
 * @description API 文档自动生成配置
 * @module server/config/swagger
 */

import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options = {
  definition: {
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
    }
  },
  apis: ['./src/routes/*.js', './src/middleware/*.js']
}

const specs = swaggerJsdoc(options)

/**
 * 设置 Swagger 文档路由
 * @param {import('express').Application} app - Express 应用实例
 */
export function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }'
  }))

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(specs)
  })
}

export default specs
