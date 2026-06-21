import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { TurnoverRecord, UserRole, BoxInfo, ExceptionRecord } from '@/types';
import { mockRecords } from '@/data/mockRecords';
import { mockBoxes } from '@/data/mockBoxes';
import { generateId } from '@/utils';

interface AppContextType {
  records: TurnoverRecord[];
  boxes: BoxInfo[];
  currentRole: UserRole;
  userName: string;
  setCurrentRole: (role: UserRole) => void;
  addRecord: (record: Omit<TurnoverRecord, 'id' | 'createdAt' | 'updatedAt' | 'nodes'> & { nodes: TurnoverRecord['nodes'] }) => void;
  updateRecord: (id: string, updates: Partial<TurnoverRecord>) => void;
  addNodeToRecord: (recordId: string, node: TurnoverRecord['nodes'][number]) => void;
  addException: (exception: Omit<ExceptionRecord, 'id' | 'createdAt' | 'handled'>) => void;
  exceptions: ExceptionRecord[];
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<TurnoverRecord[]>(mockRecords);
  const [boxes, setBoxes] = useState<BoxInfo[]>(mockBoxes);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>('driver');
  const [userName] = useState('张师傅');

  const addRecord = useCallback((recordData) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const newRecord: TurnoverRecord = {
      ...recordData,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };
    setRecords(prev => [newRecord, ...prev]);
  }, []);

  const updateRecord = useCallback((id: string, updates: Partial<TurnoverRecord>) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: now } : r));
  }, []);

  const addNodeToRecord = useCallback((recordId: string, node: TurnoverRecord['nodes'][number]) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          nodes: [...r.nodes, node],
          updatedAt: now,
          actualArrival: node.status === 'deliver' && !r.actualArrival ? node.time : r.actualArrival,
          status: node.status === 'return' ? 'normal' : r.status
        };
      }
      return r;
    }));
  }, []);

  const addException = useCallback((exceptionData) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const newException: ExceptionRecord = {
      ...exceptionData,
      id: generateId(),
      createdAt: now,
      handled: false
    };
    setExceptions(prev => [newException, ...prev]);
  }, []);

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
      addException
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
