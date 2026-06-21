import React, { useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import Timeline from '@/components/Timeline';
import Tag from '@/components/Tag';
import { boxStatusMap, formatDate, handleResultMap } from '@/utils';
import styles from './index.module.scss';

const RecordDetailPage: React.FC = () => {
  const router = useRouter();
  const { records, exceptions, currentRole, handleException } = useApp();
  const recordId = router.params.id || '';

  const record = useMemo(() => records.find(r => r.id === recordId), [records, recordId]);

  const relatedExceptions = useMemo(() => {
    return exceptions.filter(e => e.recordId === recordId || (record && e.boxCode === record.boxCode));
  }, [exceptions, recordId, record]);

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

  const handleDispatcherAction = (action: 'change_box' | 'pause_turnover' | 'resume') => {
    const exception = relatedExceptions.find(e => !e.handled);
    if (!exception) {
      Taro.showToast({ title: '暂无可处理的异常', icon: 'none' });
      return;
    }
    const actionText = action === 'change_box' ? '换箱' : action === 'pause_turnover' ? '暂停周转' : '恢复周转';
    Taro.showModal({
      title: `确认${actionText}`,
      content: `确定对箱体 ${record.boxCode} 执行"${actionText}"操作吗？`,
      confirmText: '确认处理',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          Taro.showModal({
            title: '处理备注（选填）',
            editable: true,
            placeholderText: '请输入处理说明...',
            confirmText: '提交',
            cancelText: '跳过',
            success: (noteRes) => {
              if (noteRes.confirm || noteRes.cancel) {
                handleException(exception.id, action, noteRes.content);
                Taro.showToast({ title: '处理成功', icon: 'success' });
              }
            }
          });
        }
      }
    });
  };

  const unhandledException = relatedExceptions.find(e => !e.handled);
  const latestHandledException = [...relatedExceptions].reverse().find(e => e.handled && e.handleResult);

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

      {latestHandledException && (
        <View className={styles.handledResultBanner}>
          <Text className={styles.handledIcon}>✅</Text>
          <View className={styles.handledContent}>
            <Text className={styles.handledTitle}>
              处理结果：{handleResultMap[latestHandledException.handleResult!]}
            </Text>
            <Text className={styles.handledDesc}>
              处理人：{latestHandledException.handledBy || '调度员'} · {latestHandledException.handledAt}
            </Text>
            {latestHandledException.handleDesc && (
              <Text className={styles.handledDesc}>说明：{latestHandledException.handleDesc}</Text>
            )}
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

      {relatedExceptions.length > 0 && (
        <View className={styles.infoSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>⚠️</Text>
            异常记录（{relatedExceptions.length}）
          </Text>
          <View className={styles.exceptionListCard}>
            {relatedExceptions.map(exc => (
              <View key={exc.id} className={styles.exceptionItem}>
                <View className={styles.exceptionItemHeader}>
                  <Text className={styles.exceptionType}>{exc.typeText}</Text>
                  <Tag text={exc.handled ? '已处理' : '待处理'} color={exc.handled ? 'success' : 'warning'} size="sm" />
                </View>
                <Text className={styles.exceptionDescText}>{exc.description}</Text>
                <Text className={styles.exceptionMeta}>
                  {exc.reporter} · {exc.createdAt}
                </Text>
                {exc.handled && exc.handleResult && (
                  <Text className={styles.exceptionHandleInfo}>
                    处理结果：{handleResultMap[exc.handleResult]}
                    {exc.handleDesc ? ` · ${exc.handleDesc}` : ''}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

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
        {currentRole === 'dispatcher' && unhandledException ? (
          <>
            <Button className={styles.primaryBtn} onClick={() => handleDispatcherAction('change_box')}>
              换箱
            </Button>
            <Button className={styles.dangerBtn} onClick={() => handleDispatcherAction('pause_turnover')}>
              暂停周转
            </Button>
          </>
        ) : record.status !== 'normal' || !record.nodes.some(n => n.status === 'return') ? (
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
