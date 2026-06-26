/**
 * @file 通用动态 UPDATE 构建工具
 * @description 为后端服务层提供统一的动态 UPDATE SET 子句构建逻辑，
 *              消除各 Service 中重复的 allowedColumns / columnMap / 循环拼接模式
 * @module server/database/buildUpdateSet
 */

/** 动态 UPDATE 构建结果 */
export interface UpdateSetResult {
  /** SET 子句，如 'name = ?, status = ?'；无字段需更新时为空字符串 */
  setClause: string
  /** 参数值数组（不含 WHERE 条件的 id） */
  values: unknown[]
}

/**
 * 构建动态 UPDATE SET 子句
 * @description 只更新传入的字段，忽略 undefined 值，自动过滤白名单外的字段。
 *              无字段需更新时返回空 setClause（不抛错），由调用方决定如何处理。
 * @param data 包含待更新字段的对象
 * @param allowedColumns 允许更新的列名白名单
 * @returns SET 子句和参数值；无字段时 setClause 为空字符串
 *
 * @example
 * const { setClause, values } = buildUpdateSet(
 *   { name: '新名称', status: 'active', id: 'ignore-me' },
 *   ['name', 'status', 'description']
 * )
 * // setClause = 'name = ?, status = ?'
 * // values = ['新名称', 'active']
 *
 * @example 无字段需更新时
 * const { setClause, values } = buildUpdateSet({}, ['name', 'status'])
 * // setClause = ''
 * // values = []
 */
export function buildUpdateSet(data: Record<string, unknown>, allowedColumns: string[]): UpdateSetResult {
  const updates: string[] = []
  const values: unknown[] = []

  for (const col of allowedColumns) {
    if (data[col] !== undefined) {
      updates.push(col)
      values.push(data[col])
    }
  }

  const setClause = updates.map((col) => `${col} = ?`).join(', ')

  return { setClause, values }
}
