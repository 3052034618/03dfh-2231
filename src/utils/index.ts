import Taro from '@tarojs/taro';
import type { NodeType, NodeStatus, BoxStatus, ExceptionType, HandleResult } from '@/types';

export const nodeTypeMap: Record<NodeType, string> = {
  warehouse: '仓库',
  store: '门店',
  hospital: '医院',
  transfer: '中转站'
};

export const nodeStatusMap: Record<NodeStatus, string> = {
  deliver: '交付',
  storage: '暂存',
  recycle: '回收',
  return: '空箱返场'
};

export const boxStatusMap: Record<BoxStatus, string> = {
  normal: '正常',
  overdue: '超期',
  unreturned: '未归还',
  abnormal: '异常'
};

export const boxStatusColorMap: Record<BoxStatus, string> = {
  normal: '#00B42A',
  overdue: '#FF7D00',
  unreturned: '#FF7D00',
  abnormal: '#F53F3F'
};

export const exceptionTypeMap: Record<ExceptionType, string> = {
  damaged: '箱体破损',
  ice_pack_missing: '冰排缺失',
  temp_tag_changed: '温度标签变色',
  other: '其他异常'
};

export const handleResultMap: Record<NonNullable<HandleResult>, string> = {
  change_box: '换箱',
  pause_turnover: '暂停周转',
  resume: '恢复周转'
};

export const nodeStatusSortPriority: Record<NodeStatus, number> = {
  deliver: 10,
  storage: 20,
  recycle: 30,
  return: 40
};

export const userRoleMap: Record<string, string> = {
  driver: '冷链司机',
  operator: '现场交接员',
  dispatcher: '调度员'
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date.replace(' ', 'T')) : date;
  if (isNaN(d.getTime())) return date as string;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

export const formatSimpleDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date.replace(' ', 'T')) : date;
  if (isNaN(d.getTime())) return date as string;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const storage = {
  set<T>(key: string, value: T): void {
    try {
      Taro.setStorageSync(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', key, e);
    }
  },
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const data = Taro.getStorageSync(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error('Storage get error:', key, e);
      return defaultValue;
    }
  },
  remove(key: string): void {
    try {
      Taro.removeStorageSync(key);
    } catch (e) {
      console.error('Storage remove error:', key, e);
    }
  }
};

export const STORAGE_KEYS = {
  RECORDS: 'turnover_records',
  EXCEPTIONS: 'exception_records',
  ROLE: 'current_role',
  LAST_SCAN: 'last_scan_history'
};

export const nowString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};
