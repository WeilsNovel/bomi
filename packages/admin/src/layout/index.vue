<!--
  管理后台主布局骨架
  - el-header：应用标题 + 管理员下拉（退出登录）
  - el-aside：侧边栏菜单（由 store/menu 派生，权限过滤）
  - el-main：路由出口
-->
<template>
  <el-container class="layout-root">
    <el-header class="layout-header">
      <div class="layout-header__title">{{ ENV_CONFIG.appTitle }}</div>
      <el-dropdown trigger="click" @command="handleCommand">
        <span class="layout-header__user">
          {{ displayName }}
          <el-icon class="layout-header__arrow"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">{{ DEFAULT_TEXT_CONFIG.LOGOUT_TEXT }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-header>

    <el-container class="layout-body">
      <el-aside class="layout-aside" :width="asideWidth">
        <el-menu
          :default-active="activeMenu"
          :router="true"
          class="layout-menu"
        >
          <el-menu-item
            v-for="menu in menuStore.menus"
            :key="menu.path"
            :index="menu.path"
          >
            <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
            <span>{{ menu.title }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowDown } from '@element-plus/icons-vue';
import { routes } from '@/router/routes';
import { useUserStore, usePermissionStore, useMenuStore } from '@/store';
import { ENV_CONFIG } from '@/config/env';
import { DEFAULT_TEXT_CONFIG, ROUTE_PATH_CONFIG } from '@/config/constants';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const permissionStore = usePermissionStore();
const menuStore = useMenuStore();

/** 侧边栏宽度（px） */
const ASIDE_WIDTH = 220;

/** 侧边栏宽度（响应式属性） */
const asideWidth = computed(() => `${ASIDE_WIDTH}px`);

/** 当前激活菜单（高亮） */
const activeMenu = computed(() => route.path);

/** 顶栏显示名称 */
const displayName = computed(() => userStore.userInfo?.nickname ?? '管理员');

/** 挂载时根据路由表 + 权限生成菜单 */
onMounted(() => {
  menuStore.generateMenus(routes, permissionStore.check);
});

/** 下拉菜单命令处理 */
async function handleCommand(command: string): Promise<void> {
  if (command === 'logout') {
    await userStore.logout();
    permissionStore.reset();
    menuStore.clear();
    router.push(ROUTE_PATH_CONFIG.LOGIN);
  }
}
</script>

<style scoped>
.layout-root {
  height: 100vh;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--el-color-primary);
  color: #fff;
}

.layout-header__title {
  font-size: 18px;
  font-weight: 600;
}

.layout-header__user {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  color: #fff;
}

.layout-header__arrow {
  margin-left: 4px;
}

.layout-body {
  height: calc(100vh - 60px);
}

.layout-aside {
  background-color: #fff;
  border-right: 1px solid var(--el-border-color);
}

.layout-menu {
  border-right: none;
}

.layout-main {
  background-color: var(--el-bg-color-page);
  padding: 16px;
}
</style>
