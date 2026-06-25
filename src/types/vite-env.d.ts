/**
 * @file Vite 环境变量类型声明
 * @description 为 import.meta.env 提供 TypeScript 类型支持
 * @module types/vite-env
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 应用模式 */
  readonly MODE: string
  /** 是否开发环境 */
  readonly DEV: boolean
  /** 是否生产环境 */
  readonly PROD: boolean
  /** 应用基路径 */
  readonly BASE_URL: string
  /** 应用标题 */
  readonly VITE_APP_TITLE: string
  /** API 基础路径 */
  readonly VITE_API_BASE_URL: string
  /** WebSocket 基础路径 */
  readonly VITE_WS_BASE_URL: string
  /** Sentry DSN（可选） */
  readonly VITE_SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
