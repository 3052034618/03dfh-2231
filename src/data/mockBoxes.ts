import type { BoxInfo } from '@/types';

export const mockBoxes: BoxInfo[] = [
  { id: 'b001', code: 'BOX-2024-0001', status: 'normal', type: 'GSP医药冷链箱（60L）' },
  { id: 'b002', code: 'BOX-2024-0002', status: 'abnormal', type: 'GSP医药冷链箱（40L）', lastExceptionDesc: '冰排缺失2块' },
  { id: 'b003', code: 'BOX-2024-0003', status: 'overdue', type: '食品冷链箱（80L）' },
  { id: 'b004', code: 'BOX-2024-0004', status: 'normal', type: 'GSP医药冷链箱（60L）' },
  { id: 'b005', code: 'BOX-2024-0005', status: 'normal', type: '食品冷链箱（40L）' },
  { id: 'b006', code: 'BOX-2024-0006', status: 'unreturned', type: 'GSP医药冷链箱（100L）' },
  { id: 'b007', code: 'BOX-2024-0007', status: 'normal', type: '食品冷链箱（60L）' },
  { id: 'b008', code: 'BOX-2024-0008', status: 'normal', type: 'GSP医药冷链箱（40L）' },
  { id: 'b009', code: 'BOX-2024-0009', status: 'normal', type: 'GSP医药冷链箱（60L）' },
  { id: 'b010', code: 'BOX-2024-0010', status: 'abnormal', type: '食品冷链箱（80L）', lastExceptionDesc: '箱体底部破损' }
];
