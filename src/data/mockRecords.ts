import type { TurnoverRecord } from '@/types';

export const mockRecords: TurnoverRecord[] = [
  {
    id: 'rec001',
    boxCode: 'BOX-2024-0001',
    boxType: 'GSP医药冷链箱（60L）',
    routeId: 'r001',
    routeName: '北京中心仓 → 协和医院',
    ownerId: 'o001',
    ownerName: '北京医药集团',
    driverId: 'd001',
    driverName: '张师傅',
    estimatedArrival: '2024-06-21 10:30',
    actualArrival: '2024-06-21 10:15',
    status: 'normal',
    createdAt: '2024-06-21 08:00',
    updatedAt: '2024-06-21 10:15',
    hasException: false,
    nodes: [
      {
        id: 'n001',
        nodeType: 'warehouse',
        nodeName: '北京中心仓',
        status: 'deliver',
        statusText: '出库',
        operator: '李仓库',
        operatorRole: 'operator',
        time: '2024-06-21 08:00',
        remark: '装车完成，温度正常'
      },
      {
        id: 'n002',
        nodeType: 'hospital',
        nodeName: '协和医院',
        status: 'deliver',
        statusText: '交付',
        operator: '张师傅',
        operatorRole: 'driver',
        time: '2024-06-21 10:15',
        receiver: '王护士'
      }
    ]
  },
  {
    id: 'rec002',
    boxCode: 'BOX-2024-0002',
    boxType: 'GSP医药冷链箱（40L）',
    routeId: 'r002',
    routeName: '上海分仓 → 瑞金医院',
    ownerId: 'o002',
    ownerName: '上海生物制药',
    driverId: 'd002',
    driverName: '李师傅',
    estimatedArrival: '2024-06-21 14:00',
    status: 'abnormal',
    createdAt: '2024-06-21 09:30',
    updatedAt: '2024-06-21 12:00',
    hasException: true,
    exceptionDesc: '冰排缺失2块',
    nodes: [
      {
        id: 'n003',
        nodeType: 'warehouse',
        nodeName: '上海分仓',
        status: 'deliver',
        statusText: '出库',
        operator: '赵仓库',
        operatorRole: 'operator',
        time: '2024-06-21 09:30'
      },
      {
        id: 'n004',
        nodeType: 'transfer',
        nodeName: '浦东中转站',
        status: 'storage',
        statusText: '暂存',
        operator: '李师傅',
        operatorRole: 'driver',
        time: '2024-06-21 12:00',
        remark: '发现冰排缺失，已上报异常'
      }
    ]
  },
  {
    id: 'rec003',
    boxCode: 'BOX-2024-0003',
    boxType: '食品冷链箱（80L）',
    routeId: 'r003',
    routeName: '广州生鲜仓 → 天河城门店',
    ownerId: 'o003',
    ownerName: '盒马鲜生',
    driverId: 'd003',
    driverName: '王师傅',
    estimatedArrival: '2024-06-20 18:00',
    status: 'overdue',
    createdAt: '2024-06-20 15:00',
    updatedAt: '2024-06-20 19:30',
    hasException: false,
    nodes: [
      {
        id: 'n005',
        nodeType: 'warehouse',
        nodeName: '广州生鲜仓',
        status: 'deliver',
        statusText: '出库',
        operator: '陈仓库',
        operatorRole: 'operator',
        time: '2024-06-20 15:00'
      },
      {
        id: 'n006',
        nodeType: 'store',
        nodeName: '天河城门店',
        status: 'deliver',
        statusText: '交付',
        operator: '王师傅',
        operatorRole: 'driver',
        time: '2024-06-20 19:30',
        receiver: '刘店长',
        remark: '堵车延迟送达'
      }
    ]
  },
  {
    id: 'rec004',
    boxCode: 'BOX-2024-0004',
    boxType: 'GSP医药冷链箱（60L）',
    routeId: 'r004',
    routeName: '深圳仓 → 北大医院',
    ownerId: 'o004',
    ownerName: '深圳医疗器械',
    driverId: 'd001',
    driverName: '张师傅',
    estimatedArrival: '2024-06-21 16:00',
    status: 'normal',
    createdAt: '2024-06-21 13:00',
    updatedAt: '2024-06-21 13:00',
    hasException: false,
    nodes: [
      {
        id: 'n007',
        nodeType: 'warehouse',
        nodeName: '深圳仓',
        status: 'deliver',
        statusText: '出库',
        operator: '孙仓库',
        operatorRole: 'operator',
        time: '2024-06-21 13:00'
      }
    ]
  },
  {
    id: 'rec005',
    boxCode: 'BOX-2024-0005',
    boxType: '食品冷链箱（40L）',
    routeId: 'r005',
    routeName: '杭州仓 → 西湖银泰',
    ownerId: 'o005',
    ownerName: '叮咚买菜',
    driverId: 'd002',
    driverName: '李师傅',
    estimatedArrival: '2024-06-21 11:00',
    actualArrival: '2024-06-21 10:45',
    status: 'normal',
    createdAt: '2024-06-21 08:30',
    updatedAt: '2024-06-21 11:30',
    hasException: false,
    nodes: [
      {
        id: 'n008',
        nodeType: 'warehouse',
        nodeName: '杭州仓',
        status: 'deliver',
        statusText: '出库',
        operator: '周仓库',
        operatorRole: 'operator',
        time: '2024-06-21 08:30'
      },
      {
        id: 'n009',
        nodeType: 'store',
        nodeName: '西湖银泰',
        status: 'deliver',
        statusText: '交付',
        operator: '李师傅',
        operatorRole: 'driver',
        time: '2024-06-21 10:45',
        receiver: '吴经理'
      },
      {
        id: 'n010',
        nodeType: 'warehouse',
        nodeName: '杭州仓',
        status: 'return',
        statusText: '空箱返场',
        operator: '李师傅',
        operatorRole: 'driver',
        time: '2024-06-21 11:30'
      }
    ]
  },
  {
    id: 'rec006',
    boxCode: 'BOX-2024-0006',
    boxType: 'GSP医药冷链箱（100L）',
    routeId: 'r006',
    routeName: '成都仓 → 华西医院',
    ownerId: 'o006',
    ownerName: '成都医药',
    driverId: 'd003',
    driverName: '王师傅',
    estimatedArrival: '2024-06-21 15:00',
    status: 'unreturned',
    createdAt: '2024-06-19 10:00',
    updatedAt: '2024-06-19 14:30',
    hasException: false,
    nodes: [
      {
        id: 'n011',
        nodeType: 'warehouse',
        nodeName: '成都仓',
        status: 'deliver',
        statusText: '出库',
        operator: '郑仓库',
        operatorRole: 'operator',
        time: '2024-06-19 10:00'
      },
      {
        id: 'n012',
        nodeType: 'hospital',
        nodeName: '华西医院',
        status: 'deliver',
        statusText: '交付',
        operator: '王师傅',
        operatorRole: 'driver',
        time: '2024-06-19 14:30',
        receiver: '钱主任'
      }
    ]
  },
  {
    id: 'rec007',
    boxCode: 'BOX-2024-0007',
    boxType: '食品冷链箱（60L）',
    routeId: 'r007',
    routeName: '南京仓 → 新街口店',
    ownerId: 'o007',
    ownerName: '每日优鲜',
    driverId: 'd001',
    driverName: '张师傅',
    estimatedArrival: '2024-06-21 09:30',
    actualArrival: '2024-06-21 09:20',
    status: 'normal',
    createdAt: '2024-06-21 07:00',
    updatedAt: '2024-06-21 10:00',
    hasException: false,
    nodes: [
      {
        id: 'n013',
        nodeType: 'warehouse',
        nodeName: '南京仓',
        status: 'deliver',
        statusText: '出库',
        operator: '冯仓库',
        operatorRole: 'operator',
        time: '2024-06-21 07:00'
      },
      {
        id: 'n014',
        nodeType: 'store',
        nodeName: '新街口店',
        status: 'deliver',
        statusText: '交付',
        operator: '张师傅',
        operatorRole: 'driver',
        time: '2024-06-21 09:20',
        receiver: '许店长'
      },
      {
        id: 'n015',
        nodeType: 'warehouse',
        nodeName: '南京仓',
        status: 'return',
        statusText: '空箱返场',
        operator: '张师傅',
        operatorRole: 'driver',
        time: '2024-06-21 10:00'
      }
    ]
  },
  {
    id: 'rec008',
    boxCode: 'BOX-2024-0008',
    boxType: 'GSP医药冷链箱（40L）',
    routeId: 'r008',
    routeName: '武汉仓 → 同济医院',
    ownerId: 'o008',
    ownerName: '武汉生物',
    driverId: 'd002',
    driverName: '李师傅',
    estimatedArrival: '2024-06-21 17:00',
    status: 'normal',
    createdAt: '2024-06-21 14:00',
    updatedAt: '2024-06-21 14:00',
    hasException: false,
    nodes: [
      {
        id: 'n016',
        nodeType: 'warehouse',
        nodeName: '武汉仓',
        status: 'deliver',
        statusText: '出库',
        operator: '韩仓库',
        operatorRole: 'operator',
        time: '2024-06-21 14:00'
      }
    ]
  }
];
