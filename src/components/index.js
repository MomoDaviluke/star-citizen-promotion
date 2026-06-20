/**
 * @file 组件统一导出模块
 * @description 统一导出所有组件，提供清晰的模块访问接口
 * @module components
 */

// 布局组件
export { default as SiteHeader } from './layout/SiteHeader.vue'
export { default as SiteFooter } from './layout/SiteFooter.vue'

// 通用组件
export { default as PageTitle } from './common/PageTitle.vue'
export { default as PageHeader } from './common/PageHeader.vue'
export { default as PageTransition } from './common/PageTransition.vue'
export { default as LoadingIndicator } from './common/LoadingIndicator.vue'
export { default as ErrorBoundary } from './common/ErrorBoundary.vue'

// 基础 UI 组件
export { default as BaseButton } from './common/BaseButton.vue'
export { default as BaseCard } from './common/BaseCard.vue'
export { default as BaseModal } from './common/BaseModal.vue'
export { default as BaseBadge } from './common/BaseBadge.vue'
export { default as BaseTooltip } from './common/BaseTooltip.vue'

// 科幻 UI 组件
export { default as MFDPanel } from './ui/MFDPanel.vue'
export { default as StatusIndicator } from './ui/StatusIndicator.vue'
export { default as TechButton } from './ui/TechButton.vue'
