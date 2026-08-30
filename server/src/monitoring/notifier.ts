/**
 * @file 告警通知器契约
 * @description 定义告警事件的对外通知接口与空实现。通知与告警主链路解耦：
 *              通知失败绝不能影响告警落库与评估，因此所有实现都应内部吞错。
 * @module server/monitoring/notifier
 */

import type { AlertEvent } from './alertRepository.js'

/** 通知事件类型：新开 / 恢复 / 升级（severity 只升不降） */
export type NotificationEvent = 'opened' | 'resolved' | 'escalated'

/** 一次通知载荷 */
export interface AlertNotification {
  alert: AlertEvent
  event: NotificationEvent
}

/** 告警通知器接口 */
export interface Notifier {
  notify(notification: AlertNotification): Promise<void>
}

/**
 * 空通知器
 * @description 未配置外部通道时使用，零开销且绝不影响告警链路
 */
export class NullNotifier implements Notifier {
  async notify(): Promise<void> {
    // 无操作：未配置通知通道
  }
}
