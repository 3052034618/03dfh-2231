import type { NodeType, NodeStatus, BoxStatus, ExceptionType } from '@/types';

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

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

export const formatSimpleDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};
