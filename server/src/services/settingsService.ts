import { RowDataPacket } from 'mysql2/promise'
import { query, transaction } from '../database/pool.js'

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await query<RowDataPacket[]>('SELECT `key`, `value` FROM settings')

  const settings: Record<string, string> = {}
  for (const row of rows) {
    settings[row.key] = row.value ?? ''
  }

  return settings
}

export async function updateSettings(data: Record<string, string>): Promise<Record<string, string>> {
  return transaction(async (conn) => {
    for (const [key, value] of Object.entries(data)) {
      await conn.execute(
        'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        [key, value]
      )
    }

    const [rows] = await conn.execute<RowDataPacket[]>('SELECT `key`, `value` FROM settings')

    const settings: Record<string, string> = {}
    for (const row of rows) {
      settings[row.key] = row.value ?? ''
    }

    return settings
  })
}
