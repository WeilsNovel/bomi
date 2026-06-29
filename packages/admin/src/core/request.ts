/**
 * 请求封装 - 基于 axios
 *
 * 契约对齐 @bomi/shared/types/api.ts：
 * - 后端响应统一为 BaseApiResponse<T>，本模块解包后返回 data 字段
 * - code !== 0 视为业务异常，抛出含 code / message 的错误
 * - ERROR_CODE.TOKEN_EXPIRED (40102) 特殊处理：清登录态并跳登录页
 *
 * 鉴权：除登录外所有接口需在 header 携带 Authorization: Bearer <token>，
 *       由请求拦截器统一注入，业务代码无需手动处理。
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import type { BaseApiResponse } from '@bomi/shared';
import { ERROR_CODE, ERROR_MESSAGE_MAP } from '@bomi/shared';
import { ENV_CONFIG } from '@/config/env';
import { REQUEST_TIMEOUT, ROUTE_PATH_CONFIG } from '@/config/constants';
import { clearAuth, getToken } from '@/core/storage';

/** 业务异常类型（携带 code 便于上层按错误码分支处理） */
export class BizError extends Error {
  /** 业务状态码（对齐 shared ERROR_CODE） */
  readonly code: number;
  /** 请求追踪 ID */
  readonly traceId?: string;

  constructor(code: number, message: string, traceId?: string) {
    super(message);
    this.name = 'BizError';
    this.code = code;
    this.traceId = traceId;
  }
}

/** 标准化请求入参 */
export interface RequestOptions {
  /** 请求地址（相对路径，自动拼接 apiBaseUrl） */
  url: string;
  /** 请求方法 */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** 请求参数（GET 自动作为 query，其余作为 body） */
  data?: Record<string, unknown>;
  /** 自定义超时（毫秒） */
  timeout?: number;
  /** 自定义 header */
  headers?: Record<string, string>;
}

/** axios 实例（单例） */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: ENV_CONFIG.apiBaseUrl,
  timeout: REQUEST_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

/** 请求拦截器：统一注入 Authorization 头 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/** 响应拦截器：校验 BaseApiResponse.code，code !== 0 走异常；正常返回完整 AxiosResponse */
axiosInstance.interceptors.response.use(
  (response) => {
    const body = response.data as BaseApiResponse;
    // 兜底：非标准响应结构直接抛错（防止后端未走全局拦截器）
    if (body === null || typeof body !== 'object' || typeof body.code !== 'number') {
      throw new BizError(ERROR_CODE.SERVER_ERROR, ERROR_MESSAGE_MAP[ERROR_CODE.SERVER_ERROR]);
    }
    // code !== 0 业务异常
    if (body.code !== ERROR_CODE.SUCCESS) {
      // token 失效：清登录态并跳登录页
      if (body.code === ERROR_CODE.TOKEN_EXPIRED || body.code === ERROR_CODE.UNAUTHORIZED) {
        clearAuth();
        // 使用硬跳转清除运行态，避免脏状态残留；忽略当前已在登录页的情况
        if (window.location.pathname !== ROUTE_PATH_CONFIG.LOGIN) {
          window.location.href = ROUTE_PATH_CONFIG.LOGIN;
        }
      }
      const message = ERROR_MESSAGE_MAP[body.code] ?? body.message ?? '请求失败';
      throw new BizError(body.code, message, body.traceId);
    }
    // 返回完整 AxiosResponse，由 request() 负责解包 data.data（保持 axios 类型契约）
    return response;
  },
  (error) => {
    // 网络层 / 超时 / HTTP 状态码非 2xx
    if (ENV_CONFIG.debug) {
      // 调试环境记录原始错误，便于定位
      console.error('[request] network error:', error);
    }
    const message = ERROR_MESSAGE_MAP[ERROR_CODE.SERVER_ERROR];
    return Promise.reject(new BizError(ERROR_CODE.SERVER_ERROR, message));
  },
);

/**
 * 标准化请求方法
 * @param options 请求参数对象
 * @returns Promise<解包后的 data 字段>
 */
export async function request<T = unknown>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, timeout, headers } = options;
  const config: AxiosRequestConfig = {
    url,
    method,
    headers,
    timeout,
  };
  // GET / DELETE 走 query，POST / PUT 走 body
  if (method === 'GET' || method === 'DELETE') {
    config.params = data;
  } else {
    config.data = data;
  }
  const response = await axiosInstance.request<BaseApiResponse<T>>(config);
  return response.data.data;
}

export { axiosInstance };
