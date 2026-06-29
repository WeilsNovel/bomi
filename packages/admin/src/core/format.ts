/**
 * 格式化工具 - 底层通用工具
 *
 * 集中日期 / 时间戳 / 通用字段格式化，避免业务页面重复实现。
 */

/**
 * 将时间戳或日期字符串格式化为 YYYY-MM-DD HH:mm:ss
 * @param input 时间戳（毫秒）或日期字符串
 * @returns 格式化后的字符串，输入为空返回占位符
 */
export function formatDateTime(input: number | string | null | undefined): string {
  if (input === null || input === undefined || input === '') {
    return '-';
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 将时间戳或日期字符串格式化为 YYYY-MM-DD
 * @param input 时间戳（毫秒）或日期字符串
 * @returns 格式化后的字符串，输入为空返回占位符
 */
export function formatDate(input: number | string | null | undefined): string {
  if (input === null || input === undefined || input === '') {
    return '-';
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * 手机号脱敏（138****8888），输入非 11 位原样返回
 * @param phone 原始手机号
 * @returns 脱敏后的字符串
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length !== 11) {
    return phone;
  }
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}
