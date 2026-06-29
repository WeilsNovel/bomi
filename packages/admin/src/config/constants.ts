/**
 * 全局静态参数 - 第一层（config/constants.ts）
 *
 * 全项目共享的固定常量：分页、主题色、状态枚举、弹窗尺寸、z-index、表格默认配置、超时、默认文案、路由路径。
 * 业务状态值（USER_STATUS 等）从 @bomi/shared 引用，此处不重复定义。
 *
 * 修改原则：全局统一变更仅改本文件，自动同步全项目引用处。
 */

import { USER_STATUS } from '@bomi/shared';

/** 分页配置 */
export const PAGINATION_CONFIG = {
  /** 默认页码 */
  DEFAULT_PAGE_NUM: 1,
  /** 默认每页条数 */
  DEFAULT_PAGE_SIZE: 20,
  /** 每页条数可选项 */
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

/** 主题色配置（对齐 Element Plus 主题变量） */
export const THEME_COLOR_CONFIG = {
  /** 主色 */
  PRIMARY: '#409EFF',
  /** 成功色 */
  SUCCESS: '#67C23A',
  /** 警告色 */
  WARNING: '#E6A23C',
  /** 危险色 */
  DANGER: '#F56C6C',
  /** 信息色 */
  INFO: '#909399',
} as const;

/** 业务状态枚举（引用 shared，禁止本地硬编码数字） */
export const STATUS_ENUM = {
  /** 启用（对齐 shared USER_STATUS.ENABLED） */
  ENABLED: USER_STATUS.ENABLED,
  /** 禁用（对齐 shared USER_STATUS.DISABLED） */
  DISABLED: USER_STATUS.DISABLED,
} as const;

/** 弹窗基础尺寸（宽度 px） */
export const DIALOG_SIZE_CONFIG = {
  /** 小弹窗 */
  SMALL_WIDTH: 480,
  /** 中弹窗 */
  MEDIUM_WIDTH: 640,
  /** 大弹窗 */
  LARGE_WIDTH: 960,
} as const;

/** z-index 层级（对齐 Element Plus 默认层级，避免遮挡错乱） */
export const Z_INDEX_CONFIG = {
  /** 下拉 / 弹出 */
  DROPDOWN: 2000,
  /** 抽屉 */
  DRAWER: 2010,
  /** 模态弹窗 */
  MODAL: 2020,
  /** 全局消息提示 */
  MESSAGE: 2030,
} as const;

/** 表格默认配置 */
export const TABLE_DEFAULT_CONFIG = {
  /** 行 key 字段名 */
  ROW_KEY: 'id',
  /** 是否显示边框 */
  BORDER: true,
  /** 是否斑马纹 */
  STRIPE: false,
  /** 空数据文案 */
  EMPTY_TEXT: '暂无数据',
} as const;

/** 请求超时时间（毫秒） */
export const REQUEST_TIMEOUT = 15000;

/** 默认文案 */
export const DEFAULT_TEXT_CONFIG = {
  /** 确认按钮 */
  CONFIRM_TEXT: '确认',
  /** 取消按钮 */
  CANCEL_TEXT: '取消',
  /** 加载中 */
  LOADING_TEXT: '加载中...',
  /** 空数据 */
  EMPTY_TEXT: '暂无数据',
  /** 登录 */
  LOGIN_TEXT: '登录',
  /** 退出登录 */
  LOGOUT_TEXT: '退出登录',
} as const;

/** 路由路径配置（路由表参数化，禁止在路由定义中硬编码字符串） */
export const ROUTE_PATH_CONFIG = {
  /** 登录页 */
  LOGIN: '/login',
  /** 首页（仪表盘） */
  DASHBOARD: '/dashboard',
  /** 用户管理 */
  USER_LIST: '/system/user',
  /** 打卡记录审计 */
  DIET_RECORDS: '/audit/diet-records',
  /** 运营总览 */
  STATS_OVERVIEW: '/stats/overview',
  /** 计划查看 */
  PLAN_LIST: '/plan/list',
  /** 404 */
  NOT_FOUND: '/404',
} as const;

/** 路由名称配置 */
export const ROUTE_NAME_CONFIG = {
  LOGIN: 'Login',
  DASHBOARD: 'Dashboard',
  USER_LIST: 'UserList',
  DIET_RECORDS: 'DietRecords',
  STATS_OVERVIEW: 'StatsOverview',
  PLAN_LIST: 'PlanList',
  NOT_FOUND: 'NotFound',
  LAYOUT: 'Layout',
} as const;

/** 菜单元数据 key */
export const MENU_META_KEY = {
  /** 菜单标题 */
  TITLE: 'title',
  /** 菜单图标 */
  ICON: 'icon',
  /** 是否在菜单中隐藏 */
  HIDDEN: 'hidden',
  /** 所需权限码 */
  PERMISSIONS: 'permissions',
} as const;
