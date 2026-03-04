const CONFIG = {
  server: {
    port: parseInt(import.meta.env.VITE_SERVER_PORT || '3000', 10),
    host: import.meta.env.VITE_SERVER_HOST || 'localhost',
    apiPrefix: import.meta.env.VITE_API_PREFIX || '/api'
  },
  
  ai: {
    timeout: parseInt(import.meta.env.VITE_AI_TIMEOUT || '30000', 10),
    maxRetries: parseInt(import.meta.env.VITE_AI_MAX_RETRIES || '3', 10),
    maxConcurrent: parseInt(import.meta.env.VITE_AI_MAX_CONCURRENT || '3', 10)
  },
  
  services: {
    backend: {
      port: parseInt(import.meta.env.VITE_BACKEND_PORT || '3001', 10),
      host: import.meta.env.VITE_BACKEND_HOST || 'localhost',
      baseUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    },
    ai: {
      port: parseInt(import.meta.env.VITE_AI_SERVICE_PORT || '3002', 10),
      host: import.meta.env.VITE_AI_SERVICE_HOST || 'localhost',
      baseUrl: import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:3002'
    },
    websocket: {
      port: parseInt(import.meta.env.VITE_WS_PORT || '3003', 10),
      host: import.meta.env.VITE_WS_HOST || 'localhost',
      url: import.meta.env.VITE_WS_URL || 'ws://localhost:3003'
    }
  },
  
  app: {
    name: 'Star Citizen Promotion',
    version: '1.0.0',
    environment: import.meta.env.VITE_APP_ENV || 'development'
  }
}

export const getApiUrl = (endpoint) => {
  const baseUrl = CONFIG.services.backend.baseUrl
  const prefix = CONFIG.server.apiPrefix
  return `${baseUrl}${prefix}${endpoint}`
}

export const getWsUrl = () => {
  return CONFIG.services.websocket.url
}

export const getAiServiceUrl = (endpoint) => {
  const baseUrl = CONFIG.services.ai.baseUrl
  return `${baseUrl}${endpoint}`
}

export default CONFIG
