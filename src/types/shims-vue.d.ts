/**
 * @file Vue 单文件组件类型声明
 * @description 为 .vue 文件提供 TypeScript 类型支持
 * @module types/shims-vue
 */

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
