import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import { handleResultMap, userRoleMap } from '@/utils';
import type { ExceptionRecord, HandleResult } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

type FilterTab = 'pending' | 'handled' | 'all';

const ExceptionListPage: React.FC = () => {
  const { exceptions, handleException } = useApp();
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');

  useDidShow(() => {
    console.log('[ExceptionList] 页面显示，异常总数:', exceptions.length);
  });

  const filteredExceptions = useMemo(() => {
    if (activeTab === 'pending') {
      return exceptions.filter(e => !e.handled);
    } else if (activeTab === 'handled') {
      return exceptions.filter(e => e.handled);
    }
    return exceptions;
  }, [exceptions, activeTab]);

  const handlePhotoClick = (photo: string, allPhotos: string[]) => {
    const realPhotos = allPhotos.filter(p => p.startsWith('http') || p.startsWith('file://') || p.startsWith('tmp:'));
    if (realPhotos.length > 0) {
      Taro.previewImage({
        current: photo,
        urls: realPhotos
      });
    }
  };

  const handleQuickAction = (exception: ExceptionRecord, action: HandleResult) => {
    const actionText = action === 'change_box' ? '换箱' : action === 'pause_turnover' ? '暂停周转' : '恢复周转';

    Taro.showModal({
      title: `确认${actionText}`,
      content: `确定对箱体 ${exception.boxCode} 执行"${actionText}"操作吗？`,
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

  const handleDetailClick = (exception: ExceptionRecord) => {
    if (exception.recordId) {
      Taro.navigateTo({
        url: `/pages/record-detail/index?id=${exception.recordId}`
      });
    }
  };

  if (filteredExceptions.length === 0) {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.tabsRow}>
          {(['pending', 'handled', 'all'] as FilterTab[]).map(tab => (
            <Text
              key={tab}
              className={classnames(styles.tabItem, activeTab === tab && styles.active)}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'pending' ? '待处理' : tab === 'handled' ? '已处理' : '全部'}
            </Text>
          ))}
        </View>
        <View className={styles.emptyBox}>
          <Text className={styles.emptyIcon}>✅</Text>
          <Text className={styles.emptyText}>
            {activeTab === 'pending' ? '暂无待处理异常' : activeTab === 'handled' ? '暂无已处理异常' : '暂无异常记录'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.pageContainer}>
      <View className={styles.tabsRow}>
        {(['pending', 'handled', 'all'] as FilterTab[]).map(tab => {
          const count = tab === 'pending' ? exceptions.filter(e => !e.handled).length
            : tab === 'handled' ? exceptions.filter(e => e.handled).length
            : exceptions.length;
          return (
            <Text
              key={tab}
              className={classnames(styles.tabItem, activeTab === tab && styles.active)}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'pending' ? `待处理(${count})` : tab === 'handled' ? `已处理(${count})` : `全部(${count})`}
            </Text>
          );
        })}
      </View>

      <ScrollView scrollY className={styles.listContainer}>
        {filteredExceptions.map(exception => (
          <View
            key={exception.id}
            className={classnames(styles.exceptionCard, exception.handled && styles.handled)}
          >
            <View className={styles.cardHeader}>
              <View className={styles.cardTitle}>
                <Text className={styles.boxCode}>{exception.boxCode}</Text>
                <View className={styles.typeBadge}>{exception.typeText}</View>
              </View>
              <View className={classnames(styles.statusTag, exception.handled ? styles.handled : styles.pending)}>
                {exception.handled ? '已处理' : '待处理'}
              </View>
            </View>

            <View className={styles.cardInfo} onClick={() => handleDetailClick(exception)}>
              <View className={styles.infoRow}>
                <Text className={styles.label}>上报人</Text>
                <Text className={styles.value}>
                  {userRoleMap[exception.reporterRole] || exception.reporterRole}：{exception.reporter}
                </Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.label}>上报时间</Text>
                <Text className={styles.value}>{exception.createdAt}</Text>
              </View>
              {exception.recordId && (
                <View className={styles.infoRow}>
                  <Text className={styles.label}>关联记录</Text>
                  <Text className={styles.value} style={{ color: '#1E88E5' }}>点击查看周转详情 →</Text>
                </View>
              )}
            </View>

            <View className={styles.descBox}>
              <Text className={styles.descText}>{exception.description}</Text>
            </View>

            {exception.photos && exception.photos.length > 0 && (
              <View className={styles.photosRow}>
                {exception.photos.map((photo, idx) => {
                  const isRealPhoto = photo.startsWith('http') || photo.startsWith('file://') || photo.startsWith('tmp:');
                  return (
                    <View key={idx} className={styles.photoItem}>
                      {isRealPhoto ? (
                        <Image
                          className={styles.photoImg}
                          src={photo}
                          mode="aspectFill"
                          onClick={() => handlePhotoClick(photo, exception.photos!)}
                        />
                      ) : (
                        <Text className={styles.photoIcon}>📷</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {exception.handled && exception.handleResult ? (
              <View className={styles.handleResultBox}>
                <Text className={styles.handleResultTitle}>
                  ✅ 处理结果：{handleResultMap[exception.handleResult]}
                </Text>
                <Text className={styles.handleResultText}>
                  处理人：{exception.handledBy || '调度员'} · {exception.handledAt}
                </Text>
                {exception.handleDesc && (
                  <Text className={styles.handleResultText}>处理说明：{exception.handleDesc}</Text>
                )}
              </View>
            ) : (
              <View className={styles.footerBar}>
                <View
                  className={classnames(styles.handleBtn, styles.changeBox)}
                  onClick={() => handleQuickAction(exception, 'change_box')}
                >
                  🔄 换箱
                </View>
                <View
                  className={classnames(styles.handleBtn, styles.pause)}
                  onClick={() => handleQuickAction(exception, 'pause_turnover')}
                >
                  ⏸ 暂停周转
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default ExceptionListPage;
