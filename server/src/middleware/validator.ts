import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationChain } from 'express-validator'
import { ApiError } from './errorHandler.js'

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!validations || validations.length === 0) {
      return next()
    }
    
    for (const validation of validations) {
      await validation.run(req)
    }

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }

    next(ApiError.badRequest('输入验证失败', errors.array()))
  }
}
