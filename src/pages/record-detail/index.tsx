import React, { useMemo, useState } from 'react';
import { View, Text, Button, Image } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import Timeline from '@/components/Timeline';
import Tag from '@/components/Tag';
import type { HandleProgress } from '@/types';
import { boxStatusMap, formatDate, handleResultMap, handleProgressMap, handleProgressColorMap, formatSimpleDate } from '@/utils';
import classnames from 'classnames';
import styles from './index.module.scss';

const progressStepOptions: { key: HandleProgress; label: string; icon: string }[] = [
  { key: 'contacted_driver', label: '已联系司机', icon: '📞' },
  { key: 'waiting_owner', label: '等待货主确认', icon: '⏳' },
  { key: 'processing', label: '处理中', icon: '🔧' },
  { key: 'completed', label: '已完成处理', icon: '✅' }
];

const RecordDetailPage: React.FC = () => {
  const router = useRouter();
  const { records, exceptions, currentRole, handleException, updateExceptionProgress } = useApp();
  const recordId = router.params.id || '';
  const [showProgressActions, setShowProgressActions] = useState(false);

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

  const handlePreviewPhoto = (photo: string, allPhotos: string[]) => {
    const realPhotos = allPhotos.filter(p => p.startsWith('http') || p.startsWith('file://') || p.startsWith('tmp:'));
    if (realPhotos.length > 0) {
      Taro.previewImage({
        current: photo,
        urls: realPhotos
      });
    } else {
      Taro.showToast({ title: '演示照片，暂不支持预览', icon: 'none' });
    }
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

  const handleUpdateProgress = (progress: HandleProgress) => {
    const exception = relatedExceptions.find(e => !e.handled);
    if (!exception) return;

    const label = handleProgressMap[progress];
    Taro.showModal({
      title: `更新进度：${label}`,
      editable: true,
      placeholderText: '请输入备注说明（选填）',
      confirmText: '确认更新',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm || res.cancel) {
          updateExceptionProgress(exception.id, progress, res.content);
          Taro.showToast({ title: '进度已更新', icon: 'success' });
          setShowProgressActions(false);
        }
      }
    });
  };

  const unhandledException = relatedExceptions.find(e => !e.handled);
  const latestException = relatedExceptions[0];
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

      {unhandledException && (
        <View className={styles.progressBanner}>
          <View className={styles.progressHeader}>
            <Text className={styles.progressTitle}>
              📋 当前处理进度
            </Text>
            {currentRole === 'dispatcher' && (
              <Text
                className={styles.progressUpdateBtn}
                onClick={() => setShowProgressActions(!showProgressActions)}
              >
                {showProgressActions ? '收起' : '更新进度'}
              </Text>
            )}
          </View>
          <View
            className={styles.progressCurrent}
            style={{ borderLeftColor: handleProgressColorMap[unhandledException.currentProgress] }}
          >
            <Text className={styles.progressCurrentText}>
              {unhandledException.currentProgressText}
            </Text>
            <Text className={styles.progressCurrentTime}>
              {unhandledException.progressLogs[unhandledException.progressLogs.length - 1]?.time || ''}
            </Text>
          </View>

          {showProgressActions && currentRole === 'dispatcher' && (
            <View className={styles.progressActions}>
              {progressStepOptions.map(opt => {
                const isPassed = unhandledException.progressLogs.some(l => l.status === opt.key);
                return (
                  <View
                    key={opt.key}
                    className={classnames(styles.progressActionItem, isPassed && styles.passed)}
                    onClick={() => !isPassed && handleUpdateProgress(opt.key)}
                  >
                    <Text className={styles.progressActionIcon}>{opt.icon}</Text>
                    <Text className={styles.progressActionText}>{opt.label}</Text>
                    {isPassed && <Text className={styles.progressActionCheck}>✓</Text>}
                  </View>
                );
              })}
            </View>
          )}

          {unhandledException.progressLogs.length > 0 && (
            <View className={styles.progressTimeline}>
              {unhandledException.progressLogs.map((log, idx) => (
                <View key={log.id} className={styles.progressLogItem}>
                  <View className={styles.progressDot} style={{ backgroundColor: handleProgressColorMap[log.status] }} />
                  <View className={styles.progressLogContent}>
                    <Text className={styles.progressLogStatus}>{log.statusText}</Text>
                    <Text className={styles.progressLogMeta}>
                      {log.operator} · {formatSimpleDate(log.time)}
                    </Text>
                    {log.remark && (
                      <Text className={styles.progressLogRemark}>{log.remark}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
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
                  <View style={{ display: 'flex', alignItems: 'center', gap: '16rpx' }}>
                    <Text className={styles.exceptionType}>{exc.typeText}</Text>
                    <Tag
                      text={exc.handled ? '已处理' : exc.currentProgressText}
                      color={exc.handled ? 'success' : 'warning'}
                      size="sm"
                    />
                  </View>
                  <Text className={styles.exceptionSourceTag}>异常照片</Text>
                </View>
                <Text className={styles.exceptionDescText}>{exc.description}</Text>

                {exc.photos && exc.photos.length > 0 && (
                  <View className={styles.exceptionPhotos}>
                    {exc.photos.map((photo, pIdx) => {
                      const isRealPhoto = photo.startsWith('http') || photo.startsWith('file://') || photo.startsWith('tmp:');
                      return (
                        <View key={pIdx} className={styles.exceptionPhotoItem}>
                          {isRealPhoto ? (
                            <Image
                              className={styles.exceptionPhotoImg}
                              src={photo}
                              mode="aspectFill"
                              onClick={() => handlePreviewPhoto(photo, exc.photos!)}
                            />
                          ) : (
                            <View
                              className={styles.exceptionPhotoDemo}
                              onClick={() => handlePreviewPhoto(photo, exc.photos!)}
                            >
                              <Text style={{ fontSize: '40rpx' }}>📷</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

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
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>⏱️</Text>
            流转记录
          </Text>
          <Text className={styles.sectionTag}>节点打卡照片</Text>
        </View>
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
