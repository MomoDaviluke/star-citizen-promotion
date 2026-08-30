/**
 * @file 创建设置表迁移
 * @description 系统配置键值对表（与 init.ts 中 createSettingsTable 对齐）
 *              使用 key/value 作为列名（MySQL 保留字），knex 会自动加引号
 */

export async function up(knex) {
  await knex.schema.createTable('settings', (table) => {
    table.string('key', 100).primary()
    table.text('value').nullable()
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('settings')
}
