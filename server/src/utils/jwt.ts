/**
 * @file JWT 工具模块
 * @description 统一的 JWT 签发与验证，所有 JWT 操作必须通过此模块
 * @module server/utils/jwt
 */

import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'

interface TokenPayload {
  userId: string
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    issuer: 'star-citizen-api',
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn']
  })
}

export function verifyToken(token: string): string | jwt.JwtPayload {
  return jwt.verify(token, config.jwt.secret, {
    issuer: 'star-citizen-api'
  })
}

export function decodeToken(token: string): string | jwt.JwtPayload | null {
  return jwt.decode(token)
}
