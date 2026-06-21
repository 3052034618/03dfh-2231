import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import Taro from '@tarojs/taro';
import type { TurnoverRecord, UserRole, BoxInfo, ExceptionRecord, HandleResult, HandleProgress, BoxHistoryInfo } from '@/types';
import { mockRecords } from '@/data/mockRecords';
import { mockBoxes } from '@/data/mockBoxes';
import { generateId, storage, STORAGE_KEYS, nowString, handleProgressMap } from '@/utils';

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
  addException: (exceptionData: Omit<ExceptionRecord, 'id' | 'createdAt' | 'handled' | 'currentProgress' | 'currentProgressText' | 'progressLogs'>) => ExceptionRecord;
  handleException: (exceptionId: string, result: HandleResult, handleDesc?: string) => void;
  updateExceptionProgress: (exceptionId: string, progress: HandleProgress, remark?: string) => void;
  getRecordById: (id: string) => TurnoverRecord | undefined;
  getRecordByBoxCode: (boxCode: string) => TurnoverRecord | undefined;
  getBoxByCode: (boxCode: string) => BoxInfo | undefined;
  getBoxHistory: (boxCode: string) => BoxHistoryInfo;
  checkBoxRisk: (boxCode: string) => { hasRisk: boolean; riskType?: 'abnormal' | 'overdue' | 'unreturned'; message?: string };
  exportRecordsByDate: (startDate: string, endDate: string) => {
    records: TurnoverRecord[];
    exceptions: ExceptionRecord[];
    summary: { total: number; normal: number; abnormal: number; exceptionCount: number };
  };
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
    const roleName = role === 'driver' ? '冷链司机' : role === 'operator' ? '现场交接员' : '调度员';
    Taro.showToast({ title: `已切换为${roleName}`, icon: 'success' });
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
    const initialProgress = 'reported' as HandleProgress;
    const newException: ExceptionRecord = {
      ...exceptionData,
      id: generateId(),
      createdAt: now,
      handled: false,
      currentProgress: initialProgress,
      currentProgressText: handleProgressMap[initialProgress],
      progressLogs: [{
        id: generateId(),
        status: initialProgress,
        statusText: handleProgressMap[initialProgress],
        operator: exceptionData.reporter || '司机',
        time: now
      }]
    };
    setExceptions(prev => [newException, ...prev]);

    if (exceptionData.recordId) {
      setRecords(prev => prev.map(r => r.id === exceptionData.recordId ? {
        ...r,
        status: 'abnormal',
        hasException: true,
        exceptionDesc: exceptionData.description ? `新异常：${exceptionData.typeText}` : '存在待处理异常',
        updatedAt: now
      } : r));
    }

    console.log('[AppContext] 新增异常记录:', newException.id, newException.boxCode);
    return newException;
  }, []);

  const updateExceptionProgress = useCallback((exceptionId: string, progress: HandleProgress, remark?: string) => {
    const now = nowString();
    const operator = '李调度';

    setExceptions(prev => prev.map(e => {
      if (e.id === exceptionId) {
        const newLog = {
          id: generateId(),
          status: progress,
          statusText: handleProgressMap[progress],
          operator,
          time: now,
          remark
        };
        return {
          ...e,
          currentProgress: progress,
          currentProgressText: handleProgressMap[progress],
          progressLogs: [...e.progressLogs, newLog],
          handled: progress === 'completed' ? true : e.handled,
          handledAt: progress === 'completed' ? now : e.handledAt,
          handledBy: progress === 'completed' ? operator : e.handledBy
        };
      }
      return e;
    }));

    console.log('[AppContext] 更新异常进度:', exceptionId, handleProgressMap[progress]);
  }, []);

  const handleException = useCallback((exceptionId: string, result: HandleResult, handleDesc?: string) => {
    const now = nowString();
    const operator = '李调度';

    setExceptions(prev => prev.map(e => {
      if (e.id === exceptionId) {
        const completedLog = {
          id: generateId(),
          status: 'completed' as HandleProgress,
          statusText: handleProgressMap['completed'],
          operator,
          time: now,
          remark: handleDesc
        };
        return {
          ...e,
          handled: true,
          handledAt: now,
          handledBy: operator,
          handleResult: result,
          handleDesc: handleDesc || '',
          currentProgress: 'completed' as HandleProgress,
          currentProgressText: handleProgressMap['completed'],
          progressLogs: [...e.progressLogs, completedLog]
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
    return records.find(r => r.boxCode === boxCode && !r.nodes.some(n => n.status === 'return'));
  }, [records]);

  const getBoxByCode = useCallback((boxCode: string) => {
    return boxes.find(b => b.code === boxCode);
  }, [boxes]);

  const getBoxHistory = useCallback((boxCode: string): BoxHistoryInfo => {
    const boxRecords = records.filter(r => r.boxCode === boxCode);
    const boxExceptions = exceptions.filter(e => e.boxCode === boxCode);

    const sortedRecords = [...boxRecords].sort((a, b) => {
      try {
        return new Date(b.createdAt.replace(' ', 'T')).getTime() - new Date(a.createdAt.replace(' ', 'T')).getTime();
      } catch (e) { return 0; }
    });

    const lastTurnover = sortedRecords[0];

    const sortedExceptions = [...boxExceptions].sort((a, b) => {
      try {
        return new Date(b.createdAt.replace(' ', 'T')).getTime() - new Date(a.createdAt.replace(' ', 'T')).getTime();
      } catch (e) { return 0; }
    });
    const lastException = sortedExceptions[0];

    const returnNodes: { time: string; recordId: string }[] = [];
    boxRecords.forEach(r => {
      r.nodes.forEach(n => {
        if (n.status === 'return') {
          returnNodes.push({ time: n.time, recordId: r.id });
        }
      });
    });
    const sortedReturns = returnNodes.sort((a, b) => {
      try {
        return new Date(b.time.replace(' ', 'T')).getTime() - new Date(a.time.replace(' ', 'T')).getTime();
      } catch (e) { return 0; }
    });
    const lastReturnTime = sortedReturns[0]?.time;

    const hasActiveRecord = boxRecords.some(r => !r.nodes.some(n => n.status === 'return'));

    return {
      lastTurnover,
      lastException,
      lastReturnTime,
      totalTurnoverCount: boxRecords.length,
      hasActiveRecord
    };
  }, [records, exceptions]);

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

  const exportRecordsByDate = useCallback((startDate: string, endDate: string) => {
    const start = new Date(startDate + 'T00:00:00').getTime();
    const end = new Date(endDate + 'T23:59:59').getTime();

    const filteredRecords = records.filter(r => {
      try {
        const t = new Date(r.createdAt.replace(' ', 'T')).getTime();
        return t >= start && t <= end;
      } catch (e) { return false; }
    });

    const filteredExceptions = exceptions.filter(e => {
      try {
        const t = new Date(e.createdAt.replace(' ', 'T')).getTime();
        return t >= start && t <= end;
      } catch (e) { return false; }
    });

    const normalCount = filteredRecords.filter(r => r.status === 'normal').length;
    const abnormalCount = filteredRecords.filter(r => r.status === 'abnormal').length;

    return {
      records: filteredRecords,
      exceptions: filteredExceptions,
      summary: {
        total: filteredRecords.length,
        normal: normalCount,
        abnormal: abnormalCount,
        exceptionCount: filteredExceptions.length
      }
    };
  }, [records, exceptions]);

  const contextValue = useMemo(() => ({
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
    updateExceptionProgress,
    getRecordById,
    getRecordByBoxCode,
    getBoxByCode,
    getBoxHistory,
    checkBoxRisk,
    exportRecordsByDate
  }), [
    records, boxes, exceptions, currentRole, userName,
    setCurrentRole, addRecord, updateRecord, addNodeToRecord,
    addException, handleException, updateExceptionProgress,
    getRecordById, getRecordByBoxCode, getBoxByCode,
    getBoxHistory, checkBoxRisk, exportRecordsByDate
  ]);

  return (
    <AppContext.Provider value={contextValue}>
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
