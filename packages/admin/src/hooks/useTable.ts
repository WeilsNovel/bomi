/**
 * 表格逻辑复用 Hook
 *
 * 标准化分页查询：列表数据、分页状态、loading、查询、重置。
 * 配合 ProTable / Element Plus el-table + el-pagination 使用。
 */

import { ref, reactive } from 'vue';
import { PAGINATION_CONFIG } from '@/config/constants';
import type { PageData } from '@bomi/shared';

/** useTable 入参 */
export interface UseTableParams<Q, T> {
  /** 查询接口（接收查询条件 + 分页，返回 PageData<T>） */
  fetchApi: (params: Q) => Promise<PageData<T>>;
  /** 初始查询条件（不含分页，分页由 hook 管理） */
  initialQuery?: Partial<Q>;
  /** 初始每页条数（默认 PAGINATION_CONFIG.DEFAULT_PAGE_SIZE） */
  initialPageSize?: number;
}

/** 分页状态 */
export interface PaginationState {
  /** 当前页码 */
  pageNum: number;
  /** 每页条数 */
  pageSize: number;
  /** 总条数 */
  total: number;
}

/** useTable 返回值 */
export interface UseTableReturn<Q, T> {
  /** 数据列表 */
  list: ReturnType<typeof ref<T[]>>;
  /** 加载状态 */
  loading: ReturnType<typeof ref<boolean>>;
  /** 分页状态 */
  pagination: PaginationState;
  /** 当前查询条件（响应式，可双向绑定到搜索表单） */
  query: Q;
  /** 触发查询 */
  search: () => Promise<void>;
  /** 重置查询条件并回到首页 */
  reset: () => Promise<void>;
  /** 翻页 / 切换每页条数 */
  onPageChange: (pageNum: number, pageSize: number) => Promise<void>;
}

/**
 * 表格逻辑复用 Hook
 * @param params 查询参数配置
 */
export function useTable<Q extends Record<string, unknown>, T>(
  params: UseTableParams<Q, T>,
): UseTableReturn<Q, T> {
  const { fetchApi, initialQuery = {} as Partial<Q>, initialPageSize } = params;

  const list = ref<T[]>([]) as ReturnType<typeof ref<T[]>>;
  const loading = ref(false);
  const pagination = reactive<PaginationState>({
    pageNum: PAGINATION_CONFIG.DEFAULT_PAGE_NUM,
    pageSize: initialPageSize ?? PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
    total: 0,
  });
  // 查询条件：合并初始值，分页字段由 hook 独占管理
  const query = { ...initialQuery } as Q;

  /** 执行查询 */
  const search = async () => {
    loading.value = true;
    try {
      const requestParams = {
        ...query,
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
      } as Q;
      const result = await fetchApi(requestParams);
      list.value = result.list;
      pagination.total = result.total;
    } finally {
      loading.value = false;
    }
  };

  /** 重置查询条件并回到首页 */
  const reset = async () => {
    // 清空初始查询条件以外的字段
    Object.keys(query).forEach((key) => {
      delete query[key as keyof Q];
    });
    Object.assign(query, initialQuery);
    pagination.pageNum = PAGINATION_CONFIG.DEFAULT_PAGE_NUM;
    pagination.pageSize = initialPageSize ?? PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
    await search();
  };

  /** 翻页 / 切换每页条数 */
  const onPageChange = async (pageNum: number, pageSize: number) => {
    pagination.pageNum = pageNum;
    pagination.pageSize = pageSize;
    await search();
  };

  return { list, loading, pagination, query, search, reset, onPageChange };
}
