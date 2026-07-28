/**
 * @file 创建事件表迁移
 * @description 团队活动事件表（与 init.ts 中 createEventsTable 对齐）
 *              通过 migration 创建以统一 charset，确保 FK (creator_id) REFERENCES users(id)
 *              两端 collation 一致，避免 ER_FK_INCOMPATIBLE_COLUMNS 错误
 */

export async function up(knex) {
  await knex.schema.createTable('events', (table) => {
    table.string('id', 36).primary()
    table.string('title', 255).notNullable()
    table.text('description')
    table.datetime('start_time').notNullable()
    table.datetime('end_time').nullable()
    table.string('location', 500)
    table.enum('status', ['upcoming', 'ongoing', 'completed', 'cancelled']).defaultTo('upcoming')
    table.string('creator_id', 36)
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    table.index('status', 'idx_events_status')
    table.index('start_time', 'idx_events_start_time')
    table.foreign('creator_id').references('id').inTable('users').onDelete('SET NULL')
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('events')
}
