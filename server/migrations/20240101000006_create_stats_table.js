/**
 * @file 创建统计表迁移
 * @description 统计数据表
 */

export async function up(knex) {
  await knex.schema.createTable('stats', (table) => {
    table.string('id', 36).primary()
    table.string('label', 50).notNullable()
    table.string('value', 50).notNullable()
    table.string('icon', 50)
    table.integer('sort_order').defaultTo(0)
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    table.index('sort_order', 'idx_stats_sort')
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('stats')
}
