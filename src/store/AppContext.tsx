import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import type { TurnoverRecord, UserRole, BoxInfo, ExceptionRecord, HandleResult } from '@/types';
import { mockRecords } from '@/data/mockRecords';
import { mockBoxes } from '@/data/mockBoxes';
import { generateId, storage, STORAGE_KEYS, nowString } from '@/utils';

interface AppContextType {
  records: TurnoverRecord[];
  boxes: BoxInfo[];
  exceptions: ExceptionRecord[];
  currentRole: UserRole;
  userName: string;
  setCurrentRole: (role: UserRole) => void;
  addRecord: (recordData: Omit<TurnoverRecord, 'id' | 'createdAt' | 'updatedAt'> & { nodes?: TurnoverRecord['nodes'] }) => TurnoverRecord;
  updateRecord: (id: string, updates: Partial<TurnoverRecord>) => void;
  addNodeToRecord: (recordId: string, node: TurnoverRecord['nodes'][number]) => void;
  addException: (exceptionData: Omit<ExceptionRecord, 'id' | 'createdAt' | 'handled'>) => ExceptionRecord;
  handleException: (exceptionId: string, result: HandleResult, handleDesc?: string) => void;
  getRecordById: (id: string) => TurnoverRecord | undefined;
  getRecordByBoxCode: (boxCode: string) => TurnoverRecord | undefined;
  getBoxByCode: (boxCode: string) => BoxInfo | undefined;
  checkBoxRisk: (boxCode: string) => { hasRisk: boolean; riskType?: 'abnormal' | 'overdue' | 'unreturned'; message?: string };
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<TurnoverRecord[]>([]);
  const [boxes] = useState<BoxInfo[]>(mockBoxes);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [currentRole, setCurrentRoleState] = useState<UserRole>('driver');
  const [userName] = useState('张师傅');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const loadData = () => {
      try {
        const savedRecords = storage.get<TurnoverRecord[]>(STORAGE_KEYS.RECORDS);
        const savedExceptions = storage.get<ExceptionRecord[]>(STORAGE_KEYS.EXCEPTIONS);
        const savedRole = storage.get<UserRole>(STORAGE_KEYS.ROLE);

        if (savedRecords && savedRecords.length > 0) {
          setRecords(savedRecords);
        } else {
          setRecords(mockRecords);
          storage.set(STORAGE_KEYS.RECORDS, mockRecords);
        }

        if (savedExceptions) {
          setExceptions(savedExceptions);
        }

        if (savedRole) {
          setCurrentRoleState(savedRole);
        }

        setInitialized(true);
        console.log('[AppContext] 数据加载完成');
      } catch (e) {
        console.error('[AppContext] 数据加载失败:', e);
        setRecords(mockRecords);
        setInitialized(true);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (initialized && records.length > 0) {
      storage.set(STORAGE_KEYS.RECORDS, records);
    }
  }, [records, initialized]);

  useEffect(() => {
    if (initialized) {
      storage.set(STORAGE_KEYS.EXCEPTIONS, exceptions);
    }
  }, [exceptions, initialized]);

  useEffect(() => {
    if (initialized) {
      storage.set(STORAGE_KEYS.ROLE, currentRole);
    }
  }, [currentRole, initialized]);

  const setCurrentRole = useCallback((role: UserRole) => {
    setCurrentRoleState(role);
    Taro.showToast({ title: `已切换为${role === 'driver' ? '冷链司机' : role === 'operator' ? '现场交接员' : '调度员'}`, icon: 'success' });
  }, []);

  const addRecord = useCallback((recordData): TurnoverRecord => {
    const now = nowString();
    const newRecord: TurnoverRecord = {
      ...recordData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      nodes: recordData.nodes || [],
      hasException: recordData.hasException || false
    };
    setRecords(prev => [newRecord, ...prev]);
    console.log('[AppContext] 新建周转记录:', newRecord.id, newRecord.boxCode);
    return newRecord;
  }, []);

  const updateRecord = useCallback((id: string, updates: Partial<TurnoverRecord>) => {
    const now = nowString();
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: now } : r));
    console.log('[AppContext] 更新周转记录:', id, updates);
  }, []);

  const addNodeToRecord = useCallback((recordId: string, node: TurnoverRecord['nodes'][number]) => {
    const now = nowString();
    setRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        const updatedNodes = [...r.nodes, node];
        return {
          ...r,
          nodes: updatedNodes,
          updatedAt: now,
          actualArrival: node.status === 'deliver' && !r.actualArrival ? node.time : r.actualArrival,
          status: node.status === 'return' ? 'normal' : r.status
        };
      }
      return r;
    }));
    console.log('[AppContext] 新增节点到记录:', recordId, node.statusText);
  }, []);

  const addException = useCallback((exceptionData): ExceptionRecord => {
    const now = nowString();
    const newException: ExceptionRecord = {
      ...exceptionData,
      id: generateId(),
      createdAt: now,
      handled: false
    };
    setExceptions(prev => [newException, ...prev]);
    console.log('[AppContext] 新增异常记录:', newException.id, newException.boxCode);
    return newException;
  }, []);

  const handleException = useCallback((exceptionId: string, result: HandleResult, handleDesc?: string) => {
    const now = nowString();
    setExceptions(prev => prev.map(e => {
      if (e.id === exceptionId) {
        return {
          ...e,
          handled: true,
          handledAt: now,
          handledBy: '李调度',
          handleResult: result,
          handleDesc: handleDesc || ''
        };
      }
      return e;
    }));

    const exception = exceptions.find(e => e.id === exceptionId);
    if (exception && exception.recordId) {
      if (result === 'resume') {
        setRecords(prev => prev.map(r => r.id === exception.recordId ? {
          ...r,
          status: 'normal',
          hasException: false,
          exceptionDesc: undefined,
          updatedAt: now
        } : r));
      } else if (result === 'change_box') {
        setRecords(prev => prev.map(r => r.id === exception.recordId ? {
          ...r,
          status: 'abnormal',
          hasException: true,
          exceptionDesc: handleDesc ? `已换箱：${handleDesc}` : '已调度换箱',
          updatedAt: now
        } : r));
      } else if (result === 'pause_turnover') {
        setRecords(prev => prev.map(r => r.id === exception.recordId ? {
          ...r,
          status: 'abnormal',
          hasException: true,
          exceptionDesc: handleDesc ? `已暂停：${handleDesc}` : '周转已暂停',
          updatedAt: now
        } : r));
      }
    }

    console.log('[AppContext] 处理异常:', exceptionId, result);
  }, [exceptions]);

  const getRecordById = useCallback((id: string) => {
    return records.find(r => r.id === id);
  }, [records]);

  const getRecordByBoxCode = useCallback((boxCode: string) => {
    return records.find(r => r.boxCode === boxCode);
  }, [records]);

  const getBoxByCode = useCallback((boxCode: string) => {
    return boxes.find(b => b.code === boxCode);
  }, [boxes]);

  const checkBoxRisk = useCallback((boxCode: string) => {
    const activeRecord = records.find(r => r.boxCode === boxCode && !r.nodes.some(n => n.status === 'return'));
    const box = boxes.find(b => b.code === boxCode);

    if (activeRecord && activeRecord.hasException) {
      return {
        hasRisk: true,
        riskType: 'abnormal' as const,
        message: `该箱体存在异常记录${activeRecord.exceptionDesc ? `：${activeRecord.exceptionDesc}` : ''}`
      };
    }

    if (box && box.status === 'overdue') {
      return {
        hasRisk: true,
        riskType: 'overdue' as const,
        message: '该箱体已超期未归还，请先核实情况'
      };
    }

    if (box && box.status === 'unreturned') {
      return {
        hasRisk: true,
        riskType: 'unreturned' as const,
        message: '该箱体尚未归还，请确认是否继续使用'
      };
    }

    if (activeRecord) {
      return {
        hasRisk: true,
        riskType: 'unreturned' as const,
        message: '该箱体存在在途周转记录，请确认是否重复建单'
      };
    }

    return { hasRisk: false };
  }, [records, boxes]);

  return (
    <AppContext.Provider value={{
      records,
      boxes,
      exceptions,
      currentRole,
      userName,
      setCurrentRole,
      addRecord,
      updateRecord,
      addNodeToRecord,
      addException,
      handleException,
      getRecordById,
      getRecordByBoxCode,
      getBoxByCode,
      checkBoxRisk
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
