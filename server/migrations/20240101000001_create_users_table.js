/**
 * @file 创建用户表迁移
 * @description 用户认证和角色管理表
 */

export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.string('id', 36).primary()
    table.string('username', 50).notNullable().unique()
    table.string('email', 100).notNullable().unique()
    table.string('password_hash', 255).notNullable()
    table.enum('role', ['admin', 'member', 'guest']).defaultTo('member')
    table.string('avatar', 255)
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    table.index('username', 'idx_username')
    table.index('email', 'idx_email')
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('users')
}
