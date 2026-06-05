/**
 * @file CSS 文件类型声明
 * @description 为 CSS 文件的 side-effect import 提供 TypeScript 类型支持
 * @module types/shims-css
 */

declare module '*.css' {
  const content: string
  export default content
}

declare module '*.scss' {
  const content: string
  export default content
}

declare module '*.sass' {
  const content: string
  export default content
}

declare module '*.less' {
  const content: string
  export default content
}
