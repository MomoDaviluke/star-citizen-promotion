/**
 * @file 创建项目表迁移
 * @description 战队项目信息表
 */

export async function up(knex) {
  await knex.schema.createTable('projects', (table) => {
    table.string('id', 36).primary()
    table.string('name', 100).notNullable()
    table.string('period', 50)
    table.text('description')
    table.enum('status', ['planning', 'active', 'completed', 'cancelled']).defaultTo('planning')
    table.integer('progress').defaultTo(0)
    table.integer('participants').defaultTo(0)
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    table.index('status', 'idx_projects_status')
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('projects')
}
