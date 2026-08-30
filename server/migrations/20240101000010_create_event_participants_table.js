/**
 * @file 创建事件参与人员表迁移
 * @description 事件与用户的多对多关联表（与 init.ts 中 createEventParticipantsTable 对齐）
 *              复合主键 (event_id, user_id)，FK 引用 events(id) 和 users(id)
 *              必须在 events 表 migration 之后执行
 */

export async function up(knex) {
  await knex.schema.createTable('event_participants', (table) => {
    table.string('event_id', 36).notNullable()
    table.string('user_id', 36).notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.primary(['event_id', 'user_id'])
    table.foreign('event_id').references('id').inTable('events').onDelete('CASCADE')
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('event_participants')
}
