import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import Tag from '@/components/Tag';
import classnames from 'classnames';
import { storage, STORAGE_KEYS, nowString } from '@/utils';
import styles from './index.module.scss';

type ScanMode = 'create' | 'checkin';

interface ScanHistoryItem {
  code: string;
  time: string;
  status: 'normal' | 'abnormal' | 'overdue' | 'unreturned';
}

const ScanPage: React.FC = () => {
  const router = useRouter();
  const { boxes, checkBoxRisk, getRecordByBoxCode } = useApp();
  const [mode, setMode] = useState<ScanMode>('create');
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  useEffect(() => {
    const saved = storage.get<ScanHistoryItem[]>(STORAGE_KEYS.LAST_SCAN);
    if (saved && saved.length > 0) {
      setScanHistory(saved);
    }
  }, []);

  useEffect(() => {
    const paramMode = router.params.mode;
    console.log('[Scan] 路由参数 mode:', paramMode);
    if (paramMode === 'checkin') {
      setMode('checkin');
    } else if (paramMode === 'create') {
      setMode('create');
    } else {
      const savedParams = storage.get<string>('scan_page_params');
      console.log('[Scan] storage 参数:', savedParams);
      if (savedParams) {
        const params = new URLSearchParams(savedParams);
        const storedMode = params.get('mode');
        if (storedMode === 'checkin' || storedMode === 'create') {
          setMode(storedMode);
        }
        storage.remove('scan_page_params');
      }
    }
  }, [router.params.mode]);

  useDidShow(() => {
    const paramMode = router.params.mode;
    console.log('[Scan] useDidShow, mode param:', paramMode);
    if (paramMode === 'checkin') {
      setMode('checkin');
    } else if (paramMode === 'create') {
      setMode('create');
    } else {
      const savedParams = storage.get<string>('scan_page_params');
      if (savedParams) {
        const params = new URLSearchParams(savedParams);
        const storedMode = params.get('mode');
        if (storedMode === 'checkin' || storedMode === 'create') {
          setMode(storedMode);
        }
        storage.remove('scan_page_params');
      }
    }
  });

  const modeTip = useMemo(() => mode === 'create'
    ? { title: '扫码建单', desc: '扫描箱体二维码或条形码，开始创建周转记录' }
    : { title: '节点打卡', desc: '扫描箱体二维码，进行节点打卡和状态更新' }
  , [mode]);

  const saveScanHistory = (boxCode: string, status: ScanHistoryItem['status']) => {
    const item: ScanHistoryItem = {
      code: boxCode,
      time: nowString(),
      status
    };
    const newHistory = [item, ...scanHistory.filter(h => h.code !== boxCode)].slice(0, 10);
    setScanHistory(newHistory);
    storage.set(STORAGE_KEYS.LAST_SCAN, newHistory);
  };

  const validateAndProceed = (boxCode: string) => {
    if (!boxCode || boxCode.trim().length === 0) {
      Taro.showToast({ title: '扫码内容为空，请重试', icon: 'none' });
      return;
    }

    const code = boxCode.trim();

    if (mode === 'checkin') {
      const existingRecord = getRecordByBoxCode(code);
      if (!existingRecord) {
        Taro.showModal({
          title: '未找到周转记录',
          content: `箱体 ${code} 暂无在途周转记录，请先扫码建单`,
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }
    }

    const risk = checkBoxRisk(code);
    console.log('[Scan] 扫码结果:', code, '风险检查:', risk);

    if (risk.hasRisk) {
      const statusColor: ScanHistoryItem['status'] = risk.riskType || 'abnormal';
      saveScanHistory(code, statusColor);

      Taro.showModal({
        title: '⚠️ 箱体状态提醒',
        content: risk.message || '该箱体存在风险，请确认是否继续操作',
        confirmText: '继续操作',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            proceedNext(code);
          }
        }
      });
    } else {
      saveScanHistory(code, 'normal');
      Taro.showToast({ title: `扫描成功：${code}`, icon: 'success' });
      setTimeout(() => proceedNext(code), 500);
    }
  };

  const handleScan = async () => {
    try {
      console.log('[Scan] 调起系统扫码...');

      const res = await Taro.scanCode({
        onlyFromCamera: false,
        scanType: ['qrCode', 'barCode']
      });

      console.log('[Scan] 扫码结果:', res);

      if (res && res.result) {
        validateAndProceed(res.result);
      } else {
        Taro.showToast({ title: '扫码失败，请重试', icon: 'none' });
      }
    } catch (err) {
      console.error('[Scan] 扫码异常:', err);

      const fallbackList = boxes.slice(0, 8).map(b => b.code);
      Taro.showActionSheet({
        itemList: fallbackList,
        success: (actionRes) => {
          const code = fallbackList[actionRes.tapIndex];
          validateAndProceed(code);
        },
        fail: () => {
          Taro.showToast({ title: '扫码已取消', icon: 'none' });
        }
      });
    }
  };

  const proceedNext = (boxCode: string) => {
    console.log('[Scan] 跳转到下一步，模式:', mode, '箱体:', boxCode);
    if (mode === 'create') {
      Taro.navigateTo({
        url: `/pages/create-order/index?boxCode=${encodeURIComponent(boxCode)}`
      });
    } else {
      Taro.navigateTo({
        url: `/pages/checkin/index?boxCode=${encodeURIComponent(boxCode)}`
      });
    }
  };

  const handleManualInput = () => {
    const boxCodes = boxes.map(b => b.code);
    Taro.showActionSheet({
      itemList: boxCodes,
      success: (res) => {
        validateAndProceed(boxCodes[res.tapIndex]);
      }
    });
  };

  const handleHistoryClick = (item: ScanHistoryItem) => {
    validateAndProceed(item.code);
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.modeTabs}>
        <Text
          className={classnames(styles.modeTab, mode === 'create' && styles.active)}
          onClick={() => setMode('create')}
        >
          📦 扫码建单
        </Text>
        <Text
          className={classnames(styles.modeTab, mode === 'checkin' && styles.active)}
          onClick={() => setMode('checkin')}
        >
          📍 节点打卡
        </Text>
      </View>

      <View className={styles.scanArea}>
        <View className={styles.scanIconWrap}>
          <Text className={styles.scanIcon}>📷</Text>
          <View className={styles.scanLine} />
        </View>
        <Text className={styles.scanTip}>{modeTip.title}</Text>
        <Text className={styles.scanDesc}>{modeTip.desc}</Text>
      </View>

      <View className={styles.actionButtons}>
        <Button className={styles.primaryBtn} onClick={handleScan}>
          {mode === 'create' ? '开始扫码建单' : '开始扫码打卡'}
        </Button>
        <Button className={styles.secondaryBtn} onClick={handleManualInput}>
          手动输入
        </Button>
      </View>

      {scanHistory.length > 0 && (
        <View className={styles.recentScans}>
          <Text className={styles.sectionTitle}>最近扫描</Text>
          <View className={styles.scanHistory}>
            {scanHistory.slice(0, 5).map((item, idx) => (
              <View
                key={idx}
                className={styles.historyItem}
                onClick={() => handleHistoryClick(item)}
              >
                <View className={styles.historyLeft}>
                  <View className={styles.historyIcon}>
                    <Text>📦</Text>
                  </View>
                  <View className={styles.historyInfo}>
                    <View style={{ display: 'flex', alignItems: 'center', gap: '16rpx' }}>
                      <Text className={styles.historyCode}>{item.code}</Text>
                      <Tag
                        text={
                          item.status === 'normal' ? '正常' :
                          item.status === 'abnormal' ? '异常' :
                          item.status === 'overdue' ? '超期' : '未归还'
                        }
                        color={
                          item.status === 'normal' ? 'success' :
                          item.status === 'abnormal' ? 'error' : 'warning'
                        }
                        size="sm"
                      />
                    </View>
                    <Text className={styles.historyTime}>{item.time}</Text>
                  </View>
                </View>
                <Text className={styles.historyArrow}>›</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default ScanPage;
