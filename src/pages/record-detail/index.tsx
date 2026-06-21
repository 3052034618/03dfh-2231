import React, { useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import Timeline from '@/components/Timeline';
import Tag from '@/components/Tag';
import { boxStatusMap, formatDate } from '@/utils';
import styles from './index.module.scss';

const RecordDetailPage: React.FC = () => {
  const router = useRouter();
  const { records } = useApp();
  const recordId = router.params.id || '';

  const record = useMemo(() => records.find(r => r.id === recordId), [records, recordId]);

  useDidShow(() => {
    console.log('[RecordDetail] 页面显示，记录ID：', recordId);
  });

  if (!record) {
    return (
      <View className={styles.pageContainer}>
        <View style={{ padding: '100rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ fontSize: '80rpx' }}>😕</Text>
          <Text style={{ display: 'block', marginTop: '24rpx', color: '#4E5969' }}>未找到该周转记录</Text>
        </View>
      </View>
    );
  }

  const statusColor = record.status === 'normal' ? 'success'
    : record.status === 'abnormal' ? 'error'
    : 'warning';

  const handleCheckin = () => {
    Taro.navigateTo({
      url: `/pages/checkin/index?boxCode=${record.boxCode}`
    });
  };

  const handleReportException = () => {
    Taro.navigateTo({
      url: `/pages/exception/index?boxCode=${record.boxCode}`
    });
  };

  const handleBack = () => {
    Taro.navigateBack();
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.headerCard}>
        <Text className={styles.headerBg}>❄️</Text>
        <View className={styles.boxInfo}>
          <View className={styles.boxCodeRow}>
            <Text className={styles.boxCode}>{record.boxCode}</Text>
            <Tag
              text={boxStatusMap[record.status]}
              color={statusColor as any}
            />
          </View>
          <Text className={styles.boxType}>{record.boxType}</Text>
          <View className={styles.statusRow}>
            <Text className={styles.statusTag}>
              已过 {record.nodes.length} 个节点
            </Text>
            {record.hasException && (
              <Text className={styles.exceptionTag}>
                ⚠️ 存在异常
              </Text>
            )}
          </View>
        </View>
      </View>

      {record.hasException && record.exceptionDesc && (
        <View className={styles.exceptionBanner}>
          <Text className={styles.exceptionIcon}>⚠️</Text>
          <View className={styles.exceptionContent}>
            <Text className={styles.exceptionTitle}>异常信息</Text>
            <Text className={styles.exceptionDesc}>{record.exceptionDesc}</Text>
          </View>
        </View>
      )}

      <View className={styles.infoSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📍</Text>
          运输信息
        </Text>
        <View className={styles.infoCard}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>承运线路</Text>
            <Text className={styles.infoValue}>{record.routeName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>货主</Text>
            <Text className={styles.infoValue}>{record.ownerName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>司机</Text>
            <Text className={styles.infoValue}>{record.driverName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>预计到达</Text>
            <Text className={styles.infoValue}>{record.estimatedArrival}</Text>
          </View>
          {record.actualArrival && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>实际到达</Text>
              <Text className={styles.infoValue}>{record.actualArrival}</Text>
            </View>
          )}
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>创建时间</Text>
            <Text className={styles.infoValue}>{formatDate(record.createdAt)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.infoSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>⏱️</Text>
          流转记录
        </Text>
        <View className={styles.timelineCard}>
          <Timeline nodes={record.nodes} />
        </View>
      </View>

      <View className={styles.footerBar}>
        <Button className={styles.secondaryBtn} onClick={handleBack}>
          返回
        </Button>
        {record.status !== 'normal' || !record.nodes.some(n => n.status === 'return') ? (
          <>
            <Button className={styles.primaryBtn} onClick={handleCheckin}>
              节点打卡
            </Button>
            <Button className={styles.dangerBtn} onClick={handleReportException}>
              异常上报
            </Button>
          </>
        ) : (
          <Button className={styles.primaryBtn} onClick={handleCheckin}>
            继续操作
          </Button>
        )}
      </View>
    </View>
  );
};

export default RecordDetailPage;
