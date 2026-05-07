/**
 * @file Winston 日志模块
 * @description 统一的日志管理，支持控制台和文件输出
 * @module server/utils/logger
 */

import winston from 'winston'
import { config } from '../config/index.js'

const { combine, timestamp, printf, colorize, errors, json } = winston.format

const logFormat = printf(({ level, message, timestamp: ts, stack, ...metadata }) => {
  let log = `${ts} [${level}]: ${message}`
  if (Object.keys(metadata).length > 0) {
    log += ` ${JSON.stringify(metadata)}`
  }
  if (stack) {
    log += `\n${stack}`
  }
  return log
})

const jsonFormat = combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json())
const consoleFormat = combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), colorize({ all: true }), errors({ stack: true }), logFormat)

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: config.nodeEnv === 'production' ? jsonFormat : consoleFormat
  })
]

if (config.logging?.file?.enabled) {
  transports.push(
    new winston.transports.File({
      filename: config.logging.file.error || 'logs/error.log',
      level: 'error',
      format: jsonFormat
    }),
    new winston.transports.File({
      filename: config.logging.file.combined || 'logs/combined.log',
      format: jsonFormat
    })
  )
}

const logger = winston.createLogger({
  level: config.logging?.level || 'info',
  defaultMeta: { service: 'star-citizen-api' },
  transports
})

export default logger
