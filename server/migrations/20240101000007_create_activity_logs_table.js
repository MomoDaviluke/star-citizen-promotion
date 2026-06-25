/**
 * @file 创建活动日志表迁移
 * @description 用户活动审计日志表
 */

export async function up(knex) {
  await knex.schema.createTable('activity_logs', (table) => {
    table.string('id', 36).primary()
    table.string('user_id', 36)
    table.string('action', 50).notNullable()
    table.string('entity_type', 50)
    table.string('entity_id', 36)
    table.json('details')
    table.string('ip_address', 45)
    table.string('user_agent', 255)
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.index('user_id', 'idx_logs_user')
    table.index('action', 'idx_logs_action')
    table.index('created_at', 'idx_logs_created')
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL')
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('activity_logs')
}
