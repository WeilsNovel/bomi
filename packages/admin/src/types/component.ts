/**
 * 管理后台组件参数类型 - 第三层标准化参数
 *
 * 仅定义后台本地组件参数类型（ProTable / ProForm / ProDialog）。
 * 接口 DTO 类型一律从 @bomi/shared 引用，禁止在此重复定义。
 */

/** 通用组件参数基类 */
export interface BaseComponentParams {
  /** 是否显示 */
  visible?: boolean;
  /** 自定义类名 */
  customClass?: string;
  /** 自定义样式 */
  customStyle?: Record<string, string>;
}

/** 表格列配置参数（ProTable 列描述） */
export interface ProTableColumn<T = Record<string, unknown>> {
  /** 列字段名（对应数据 key） */
  prop: keyof T & string;
  /** 列标题 */
  label: string;
  /** 列宽（px） */
  width?: number;
  /** 最小列宽（px） */
  minWidth?: number;
  /** 是否固定列（left / right / false） */
  fixed?: 'left' | 'right' | false;
  /** 是否可排序 */
  sortable?: boolean;
  /** 自定义格式化函数 */
  formatter?: (row: T, column: ProTableColumn<T>, cellValue: unknown, index: number) => string;
  /** 是否在操作列插槽渲染 */
  slot?: boolean;
}

/** ProTable 组件参数 */
export interface ProTableParams<T = Record<string, unknown>> extends BaseComponentParams {
  /** 列配置 */
  columns: ProTableColumn<T>[];
  /** 数据列表 */
  data: T[];
  /** 是否加载中 */
  loading: boolean;
  /** 是否显示边框 */
  border: boolean;
  /** 是否斑马纹 */
  stripe: boolean;
  /** 行 key 字段名 */
  rowKey: string;
  /** 是否显示分页 */
  showPagination: boolean;
  /** 当前页码 */
  pageNum: number;
  /** 每页条数 */
  pageSize: number;
  /** 总条数 */
  total: number;
}

/** ProTable 默认参数 */
export const DEFAULT_PRO_TABLE_PARAMS: Omit<ProTableParams, 'columns' | 'data'> = {
  visible: true,
  customClass: '',
  customStyle: {},
  loading: false,
  border: true,
  stripe: false,
  rowKey: 'id',
  showPagination: true,
  pageNum: 1,
  pageSize: 20,
  total: 0,
};

/** ProDialog 组件参数 */
export interface ProDialogParams extends BaseComponentParams {
  /** 弹窗标题 */
  title: string;
  /** 弹窗宽度（px） */
  width: number;
  /** 是否在点击遮罩层时关闭弹窗 */
  closeOnClickModal: boolean;
  /** 是否显示底部确认 / 取消按钮 */
  showFooter: boolean;
}

/** ProDialog 默认参数 */
export const DEFAULT_PRO_DIALOG_PARAMS: Omit<ProDialogParams, 'title'> = {
  visible: false,
  customClass: '',
  customStyle: {},
  width: 640,
  closeOnClickModal: false,
  showFooter: true,
};

/** ProForm 表单项参数 */
export interface ProFormItem {
  /** 字段名 */
  prop: string;
  /** 标签 */
  label: string;
  /** 控件类型 */
  type: 'input' | 'select' | 'date' | 'switch' | 'textarea' | 'number';
  /** 占位文案 */
  placeholder?: string;
  /** 是否必填 */
  required?: boolean;
  /** 选项（type=select 时使用） */
  options?: { label: string; value: string | number }[];
  /** 默认值 */
  defaultValue?: unknown;
}

/** ProForm 组件参数 */
export interface ProFormParams extends BaseComponentParams {
  /** 表单项配置 */
  items: ProFormItem[];
  /** 标签位置 */
  labelPosition: 'left' | 'right' | 'top';
  /** 标签宽度（px） */
  labelWidth: number;
}
