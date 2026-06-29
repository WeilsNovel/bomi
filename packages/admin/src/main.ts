/**
 * 应用入口
 *
 * 装配顺序：Pinia → Router → Element Plus → 图标全局注册 → 挂载
 *
 * Stage 1 采用 Element Plus 全量引入（简单优先）；
 * Stage 2 可改用 unplugin-auto-import + unplugin-vue-components 按需引入减小体积。
 */

import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import { pinia } from '@/store';
import router from '@/router';
import '@/style.css';

const app = createApp(App);

// 注册所有 Element Plus 图标为全局组件（侧边栏 <component :is="icon"> 依赖此注册）
// TODO(Stage2): 改按需注册，仅引入路由 meta.icon 用到的图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(pinia);
app.use(router);
app.use(ElementPlus);

app.mount('#app');
