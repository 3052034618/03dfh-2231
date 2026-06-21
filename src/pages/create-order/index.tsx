import React, { useState, useMemo } from 'react';
import { View, Text, Button, Picker } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import { mockRoutes, mockOwners } from '@/data/mockRoutes';
import Tag from '@/components/Tag';
import classnames from 'classnames';
import { generateId, formatSimpleDate } from '@/utils';
import styles from './index.module.scss';

const CreateOrderPage: React.FC = () => {
  const router = useRouter();
  const { boxes, addRecord, userName, currentRole, getBoxHistory } = useApp();
  const boxCode = router.params.boxCode || 'BOX-2024-0001';

  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [etaDate, setEtaDate] = useState('');
  const [etaTime, setEtaTime] = useState('');

  const boxInfo = useMemo(() => boxes.find(b => b.code === boxCode) || {
    id: 'mock', code: boxCode, status: 'normal' as const, type: 'GSP医药冷链箱（60L）'
  }, [boxes, boxCode]);

  const boxHistory = useMemo(() => getBoxHistory(boxCode), [getBoxHistory, boxCode]);

  useDidShow(() => {
    console.log('[CreateOrder] 页面显示，箱体编号：', boxCode);
  });

  const hasWarning = boxInfo.status !== 'normal';

  const canSubmit = selectedRouteId && selectedOwnerId && etaDate && etaTime;

  const handleSubmit = () => {
    if (!canSubmit) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    const route = mockRoutes.find(r => r.id === selectedRouteId);
    const owner = mockOwners.find(o => o.id === selectedOwnerId);
    const estimatedArrival = `${etaDate} ${etaTime}`;

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

    addRecord({
      boxCode: boxInfo.code,
      boxType: boxInfo.type,
      routeId: selectedRouteId,
      routeName: route?.name || '',
      ownerId: selectedOwnerId,
      ownerName: owner?.name || '',
      driverId: 'd001',
      driverName: userName,
      estimatedArrival,
      status: 'normal',
      hasException: boxInfo.status === 'abnormal',
      exceptionDesc: boxInfo.lastExceptionDesc,
      nodes: [{
        id: generateId(),
        nodeType: 'warehouse',
        nodeName: route?.from || '仓库',
        status: 'deliver',
        statusText: '出库',
        operator: userName,
        operatorRole: currentRole,
        time: now,
        remark: '扫码建单出库'
      }]
    });

    Taro.showToast({ title: '建单成功', icon: 'success' });
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/records/index' });
    }, 1000);
  };

  const getDefaultDate = () => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return d.toISOString().slice(0, 10);
  };

  const getDefaultTime = () => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.boxInfoCard}>
        <View className={styles.boxHeader}>
          <View className={styles.boxLeft}>
            <Text className={styles.boxIcon}>📦</Text>
            <View>
              <Text className={styles.boxCode}>{boxInfo.code}</Text>
              <Text className={styles.boxType}>{boxInfo.type}</Text>
            </View>
          </View>
          <Tag
            text={boxInfo.status === 'normal' ? '正常' : boxInfo.status === 'abnormal' ? '异常' : boxInfo.status === 'overdue' ? '超期' : '未归还'}
            color={boxInfo.status === 'normal' ? 'success' : 'warning'}
          />
        </View>
      </View>

      {hasWarning && (
        <View className={styles.warnBanner}>
          <Text className={styles.warnIcon}>⚠️</Text>
          <View className={styles.warnContent}>
            <Text className={styles.warnTitle}>箱体状态提醒</Text>
            <Text className={styles.warnDesc}>
              {boxInfo.status === 'abnormal' ? '该箱体存在异常记录' : boxInfo.status === 'overdue' ? '该箱体已超期' : '该箱体未归还'}
              {boxInfo.lastExceptionDesc ? `：${boxInfo.lastExceptionDesc}` : ''}
            </Text>
          </View>
        </View>
      )}

      <View className={styles.historyCard}>
        <View className={styles.historyHeader}>
          <Text className={styles.historyTitle}>
            <Text style={{ marginRight: '8rpx' }}>📋</Text>
            箱体历史追溯
          </Text>
          <Text className={styles.historyCount}>
            累计 {boxHistory.totalTurnoverCount} 次周转
          </Text>
        </View>
        <View className={styles.historyList}>
          <View className={styles.historyItem}>
            <Text className={styles.historyLabel}>最近回收时间</Text>
            <Text className={styles.historyValue}>
              {boxHistory.lastReturnTime ? formatSimpleDate(boxHistory.lastReturnTime) : '—'}
            </Text>
          </View>
          <View className={styles.historyItem}>
            <Text className={styles.historyLabel}>上次周转线路</Text>
            <Text className={styles.historyValue}>
              {boxHistory.lastTurnover?.routeName || '—'}
            </Text>
          </View>
          <View className={styles.historyItem}>
            <Text className={styles.historyLabel}>上次异常</Text>
            <Text className={classnames(styles.historyValue, boxHistory.lastException && styles.textDanger)}>
              {boxHistory.lastException
                ? `${boxHistory.lastException.typeText} · ${formatSimpleDate(boxHistory.lastException.createdAt)}`
                : '无异常记录'}
            </Text>
          </View>
          <View className={styles.historyItem}>
            <Text className={styles.historyLabel}>当前状态</Text>
            <Text className={classnames(styles.historyValue, boxHistory.hasActiveRecord && styles.textWarning)}>
              {boxHistory.hasActiveRecord ? '在途周转中' : '已回库，可使用'}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📍</Text>
          选择承运线路
        </Text>
        <View className={styles.formCard}>
          <View className={styles.optionGrid}>
            {mockRoutes.map(route => (
              <View
                key={route.id}
                className={classnames(styles.optionItem, selectedRouteId === route.id && styles.active)}
                onClick={() => setSelectedRouteId(route.id)}
              >
                <Text className={styles.optionText}>{route.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🏢</Text>
          选择货主
        </Text>
        <View className={styles.formCard}>
          <View className={styles.optionGrid}>
            {mockOwners.map(owner => (
              <View
                key={owner.id}
                className={classnames(styles.optionItem, selectedOwnerId === owner.id && styles.active)}
                onClick={() => setSelectedOwnerId(owner.id)}
              >
                <Text className={styles.optionText}>{owner.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>⏰</Text>
          预计到达时间
        </Text>
        <View className={styles.formCard}>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>到达日期</Text>
            <Picker mode="date" value={etaDate || getDefaultDate()} onChange={e => setEtaDate(e.detail.value)}>
              <View className={styles.datePickerWrap}>
                <Text className={etaDate ? styles.formValue : styles.formPlaceholder}>
                  {etaDate || '请选择日期'}
                </Text>
                <Text className={styles.formArrow}>›</Text>
              </View>
            </Picker>
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>到达时间</Text>
            <Picker mode="time" value={etaTime || getDefaultTime()} onChange={e => setEtaTime(e.detail.value)}>
              <View className={styles.datePickerWrap}>
                <Text className={etaTime ? styles.formValue : styles.formPlaceholder}>
                  {etaTime || '请选择时间'}
                </Text>
                <Text className={styles.formArrow}>›</Text>
              </View>
            </Picker>
          </View>
        </View>
      </View>

      <View className={styles.footerBar}>
        <Button className={styles.cancelBtn} onClick={() => Taro.navigateBack()}>
          取消
        </Button>
        <Button
          className={classnames(styles.submitBtn, !canSubmit && styles.disabled)}
          onClick={handleSubmit}
        >
          确认建单
        </Button>
      </View>
    </View>
  );
};

export default CreateOrderPage;
