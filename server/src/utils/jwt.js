/**
 * @file JWT 工具模块
 * @description 统一的 JWT 签发与验证，所有 JWT 操作必须通过此模块
 * @module server/utils/jwt
 */

import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'

/**
 * 签发访问令牌
 * @param {Object} payload - 令牌载荷
 * @param {string} payload.userId - 用户 ID
 * @returns {string} JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    issuer: 'star-citizen-api',
    expiresIn: config.jwt.expiresIn
  })
}

/**
 * 验证令牌
 * @param {string} token - JWT token
 * @returns {Object} 解码后的 payload
 * @throws {Error} 令牌无效或已过期
 */
export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret, {
    issuer: 'star-citizen-api'
  })
}

/**
 * 解码令牌（不验证签名）
 * @param {string} token - JWT token
 * @returns {Object|null} 解码结果或 null
 */
export function decodeToken(token) {
  return jwt.decode(token)
}
