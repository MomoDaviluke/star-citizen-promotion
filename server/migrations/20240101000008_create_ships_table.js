/**
 * @file 创建舰船表迁移
 * @description 舰队舰船资产管理表（与 init.ts 中 createShipsTable 对齐）
 *              通过 migration 创建以统一 charset，避免 init.ts CREATE TABLE IF NOT EXISTS
 *              与已有 migration 创建的表 collation 不一致导致 FK 报错
 */

export async function up(knex) {
  await knex.schema.createTable('ships', (table) => {
    table.string('id', 36).primary()
    table.string('name', 100).notNullable()
    table.string('callsign', 50)
    table.string('ship', 100).notNullable()
    table.enum('category', ['combat', 'transport', 'explore', 'support']).defaultTo('combat')
    table.enum('status', ['available', 'borrowed', 'inMission', 'maintenance']).defaultTo('available')
    table.bigInteger('value').defaultTo(0)
    table.string('image', 500)
    table.text('description')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    table.index('category', 'idx_ships_category')
    table.index('status', 'idx_ships_status')
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('ships')
}
