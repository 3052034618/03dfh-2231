import type { Route, Owner } from '@/types';

export const mockRoutes: Route[] = [
  { id: 'r001', name: '北京中心仓 → 协和医院', from: '北京中心仓', to: '协和医院' },
  { id: 'r002', name: '上海分仓 → 瑞金医院', from: '上海分仓', to: '瑞金医院' },
  { id: 'r003', name: '广州生鲜仓 → 天河城门店', from: '广州生鲜仓', to: '天河城门店' },
  { id: 'r004', name: '深圳仓 → 北大医院', from: '深圳仓', to: '北大医院' },
  { id: 'r005', name: '杭州仓 → 西湖银泰', from: '杭州仓', to: '西湖银泰' },
  { id: 'r006', name: '成都仓 → 华西医院', from: '成都仓', to: '华西医院' },
  { id: 'r007', name: '南京仓 → 新街口店', from: '南京仓', to: '新街口店' },
  { id: 'r008', name: '武汉仓 → 同济医院', from: '武汉仓', to: '同济医院' }
];

export const mockOwners: Owner[] = [
  { id: 'o001', name: '北京医药集团', contact: '010-12345678' },
  { id: 'o002', name: '上海生物制药', contact: '021-87654321' },
  { id: 'o003', name: '盒马鲜生', contact: '020-11112222' },
  { id: 'o004', name: '深圳医疗器械', contact: '0755-33334444' },
  { id: 'o005', name: '叮咚买菜', contact: '0571-55556666' },
  { id: 'o006', name: '成都医药', contact: '028-77778888' },
  { id: 'o007', name: '每日优鲜', contact: '025-99990000' },
  { id: 'o008', name: '武汉生物', contact: '027-12121212' }
];
