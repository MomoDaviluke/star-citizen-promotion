/**
 * @file 创建成员表迁移
 * @description 战队成员信息表
 */

export async function up(knex) {
  await knex.schema.createTable('members', (table) => {
    table.string('id', 36).primary()
    table.string('name', 50).notNullable()
    table.string('role', 50).notNullable()
    table.text('intro')
    table.string('avatar', 255)
    table.date('join_date')
    table.enum('status', ['active', 'inactive', 'retired']).defaultTo('active')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    table.index('status', 'idx_members_status')
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('members')
}
