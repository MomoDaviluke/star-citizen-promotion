/**
 * @file 创建飞行员表迁移
 * @description 飞行员信息和战绩表
 */

export async function up(knex) {
  await knex.schema.createTable('pilots', (table) => {
    table.string('id', 36).primary()
    table.string('name', 50).notNullable()
    table.string('callsign', 50).notNullable()
    table.string('ship', 100).notNullable()
    table.text('description')
    table.string('image', 255)
    table.integer('missions').defaultTo(0)
    table.integer('kills').defaultTo(0)
    table.enum('status', ['active', 'inactive', 'kia']).defaultTo('active')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    table.index('status', 'idx_pilots_status')
    table.index('missions', 'idx_pilots_missions')
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('pilots')
}
