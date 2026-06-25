/**
 * @file 创建申请表迁移
 * @description 战队申请表
 */

export async function up(knex) {
  await knex.schema.createTable('applications', (table) => {
    table.string('id', 36).primary()
    table.string('name', 50).notNullable()
    table.string('email', 100).notNullable()
    table.string('discord', 50)
    table.text('experience')
    table.string('availability', 50)
    table.text('reason')
    table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending')
    table.string('reviewed_by', 36)
    table.timestamp('reviewed_at').nullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    table.index('status', 'idx_applications_status')
    table.index('email', 'idx_applications_email')
    table.index('created_at', 'idx_applications_created')
    table.foreign('reviewed_by').references('id').inTable('users').onDelete('SET NULL')
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('applications')
}
