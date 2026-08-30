/**
 * @file 创建监控告警表迁移
 * @description monitor_alerts 存告警事件与上下文快照，monitor_reports 存前端回报。
 *              与 database/schema.ts 中的 TABLE_SCHEMAS 定义保持一致。
 */

export async function up(knex) {
  await knex.schema.createTable('monitor_alerts', (table) => {
    table.string('id', 36).primary()
    table.string('rule', 50).notNullable()
    table.enu('severity', ['warn', 'critical']).notNullable()
    table.decimal('metric_value', 12, 4).notNullable()
    table.decimal('threshold', 12, 4).notNullable()
    table.enu('status', ['active', 'acked', 'resolved']).notNullable().defaultTo('active')
    table.integer('hit_count').notNullable().defaultTo(1)
    table.string('message', 255).notNullable()
    table.json('snapshot').nullable()
    table.string('ack_by', 36).nullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    table.timestamp('resolved_at').nullable()
    table.index(['status', 'created_at'], 'idx_alerts_status_created')
    table.index(['rule', 'created_at'], 'idx_alerts_rule_created')
  })

  await knex.schema.createTable('monitor_reports', (table) => {
    table.string('id', 36).primary()
    table.string('request_id', 64).nullable()
    table.enu('category', ['frontend_error', 'slow_page', 'api_failure', 'manual']).notNullable().defaultTo('manual')
    table.text('message').nullable()
    table.json('browser').nullable()
    table.json('payload').nullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.index(['request_id'], 'idx_reports_request')
    table.index(['created_at'], 'idx_reports_created')
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('monitor_reports')
  await knex.schema.dropTableIfExists('monitor_alerts')
}
