/**
 * @file 应用入口文件
 * @description Vue 应用初始化与全局配置入口，负责创建应用实例、注册插件并挂载到 DOM
 * @module main
 */

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/base.css'

const app = createApp(App)

app.use(router)

app.mount('#app')
