export type BoxStatus = 'normal' | 'overdue' | 'unreturned' | 'abnormal';

export type NodeType = 'warehouse' | 'store' | 'hospital' | 'transfer';

export type NodeStatus = 'deliver' | 'storage' | 'recycle' | 'return';

export type ExceptionType = 'damaged' | 'ice_pack_missing' | 'temp_tag_changed' | 'other';

export type UserRole = 'driver' | 'operator' | 'dispatcher';

export type HandleAction = 'change_box' | 'pause_turnover' | 'none';

export type HandleResult = 'change_box' | 'pause_turnover' | 'resume' | null;

export interface BoxInfo {
  id: string;
  code: string;
  status: BoxStatus;
  lastExceptionDesc?: string;
  type: string;
}

export interface Route {
  id: string;
  name: string;
  from: string;
  to: string;
}

export interface Owner {
  id: string;
  name: string;
  contact?: string;
}

export interface TimelineNode {
  id: string;
  nodeType: NodeType;
  nodeName: string;
  status: NodeStatus;
  statusText: string;
  operator: string;
  operatorRole: UserRole;
  time: string;
  receiver?: string;
  photos?: string[];
  remark?: string;
}

export interface TurnoverRecord {
  id: string;
  boxCode: string;
  boxType: string;
  routeId: string;
  routeName: string;
  ownerId: string;
  ownerName: string;
  driverId: string;
  driverName: string;
  estimatedArrival: string;
  actualArrival?: string;
  status: BoxStatus;
  createdAt: string;
  updatedAt: string;
  nodes: TimelineNode[];
  hasException: boolean;
  exceptionDesc?: string;
}

export interface ExceptionRecord {
  id: string;
  boxCode: string;
  recordId: string;
  type: ExceptionType;
  typeText: string;
  description: string;
  photos: string[];
  reporter: string;
  reporterRole: UserRole;
  createdAt: string;
  handled: boolean;
  handledAt?: string;
  handledBy?: string;
  handleResult?: HandleResult;
  handleDesc?: string;
}
