import React, { useState, useMemo } from 'react';
import { View, Text, Button, Input, Textarea, Image } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import Tag from '@/components/Tag';
import classnames from 'classnames';
import type { NodeType, NodeStatus } from '@/types';
import { nodeTypeMap, nodeStatusMap, generateId, boxStatusMap, formatSimpleDate } from '@/utils';
import styles from './index.module.scss';

const nodeTypeOptions: { key: NodeType; label: string; icon: string }[] = [
  { key: 'warehouse', label: '仓库', icon: '🏭' },
  { key: 'store', label: '门店', icon: '🏪' },
  { key: 'hospital', label: '医院', icon: '🏥' },
  { key: 'transfer', label: '中转站', icon: '🚚' }
];

const statusOptions: { key: NodeStatus; label: string }[] = [
  { key: 'deliver', label: '交付' },
  { key: 'storage', label: '暂存' },
  { key: 'recycle', label: '回收' },
  { key: 'return', label: '空箱返场' }
];

const CheckinPage: React.FC = () => {
  const router = useRouter();
  const { records, addNodeToRecord, userName, currentRole, updateRecord, getBoxHistory } = useApp();
  const boxCode = router.params.boxCode || 'BOX-2024-0001';

  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>('');
  const [selectedStatus, setSelectedStatus] = useState<NodeStatus>('');
  const [nodeName, setNodeName] = useState('');
  const [receiver, setReceiver] = useState('');
  const [remark, setRemark] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const currentRecord = useMemo(() => records.find(r => r.boxCode === boxCode && !r.nodes.some(n => n.status === 'return')), [records, boxCode]);

  const boxHistory = useMemo(() => getBoxHistory(boxCode), [getBoxHistory, boxCode]);

  useDidShow(() => {
    console.log('[Checkin] 页面显示，箱体：', boxCode, '是否有记录：', !!currentRecord);
    if (currentRecord) {
      const route = currentRecord.routeName;
      const match = route.match(/→\s*(.+)$/);
      if (match) {
        setNodeName(match[1].trim());
      }
    }
  });

  const canSubmit = selectedNodeType && selectedStatus && (selectedStatus === 'return' || (nodeName && receiver));

  const handlePhotoClick = () => {
    const remaining = 3 - photos.length;
    if (remaining <= 0) {
      Taro.showToast({ title: '最多上传3张照片', icon: 'none' });
      return;
    }

    Taro.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: async (res) => {
        try {
          const sourceType = res.tapIndex === 0 ? ['camera'] : ['album'];
          const chooseRes = await Taro.chooseImage({
            count: remaining,
            sizeType: ['compressed'],
            sourceType: sourceType as any
          });

          if (chooseRes && chooseRes.tempFilePaths && chooseRes.tempFilePaths.length > 0) {
            setPhotos(prev => [...prev, ...chooseRes.tempFilePaths].slice(0, 3));
            Taro.showToast({ title: `已添加${chooseRes.tempFilePaths.length}张照片`, icon: 'success' });
          }
        } catch (err) {
          console.error('[Checkin] 选图失败:', err);
          const fallbackPhotos = Array.from({ length: Math.min(remaining, 1) }, (_, i) =>
            `photo_demo_${Date.now()}_${i}`
          );
          setPhotos(prev => [...prev, ...fallbackPhotos].slice(0, 3));
          Taro.showToast({ title: '已添加演示照片', icon: 'success' });
        }
      }
    });
  };

  const handlePreviewPhoto = (idx: number) => {
    if (photos[idx].startsWith('http') || photos[idx].startsWith('file://') || photos[idx].startsWith('tmp:')) {
      Taro.previewImage({
        current: photos[idx],
        urls: photos.filter(p => p.startsWith('http') || p.startsWith('file://') || p.startsWith('tmp:'))
      });
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      Taro.showToast({ title: '请填写必要信息', icon: 'none' });
      return;
    }

    if (!currentRecord) {
      Taro.showModal({
        title: '提示',
        content: '该箱体暂无在途周转记录，请先扫码建单',
        showCancel: false
      });
      return;
    }

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

    addNodeToRecord(currentRecord.id, {
      id: generateId(),
      nodeType: selectedNodeType,
      nodeName: nodeName || nodeTypeMap[selectedNodeType],
      status: selectedStatus,
      statusText: statusOptions.find(s => s.key === selectedStatus)?.label || '',
      operator: userName,
      operatorRole: currentRole,
      time: now,
      receiver: receiver || undefined,
      photos: photos.length > 0 ? photos : undefined,
      remark: remark || undefined
    });

    if (selectedStatus === 'return') {
      updateRecord(currentRecord.id, { status: 'normal' });
    }

    Taro.showToast({ title: '打卡成功', icon: 'success' });
    setTimeout(() => {
      Taro.redirectTo({
        url: `/pages/record-detail/index?id=${currentRecord.id}`
      });
    }, 1000);
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.boxInfoCard}>
        <View className={styles.boxHeader}>
          <View className={styles.boxLeft}>
            <Text className={styles.boxIcon}>📦</Text>
            <View>
              <Text className={styles.boxCode}>{boxCode}</Text>
              {currentRecord ? (
                <Text className={styles.boxRoute}>{currentRecord.routeName}</Text>
              ) : (
                <Tag text="未找到在途记录" color="warning" size="sm" />
              )}
            </View>
          </View>
          {currentRecord && (
            <Tag
              text={boxStatusMap[currentRecord.status]}
              color={currentRecord.status === 'normal' ? 'success' : currentRecord.status === 'abnormal' ? 'error' : 'warning'}
            />
          )}
        </View>
      </View>

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
            <Text className={styles.historyLabel}>当前运输</Text>
            <Text className={classnames(styles.historyValue, styles.textPrimary)}>
              {boxHistory.hasActiveRecord && boxHistory.lastTurnover?.routeName
                ? boxHistory.lastTurnover.routeName
                : '无在途记录'}
            </Text>
          </View>
          <View className={styles.historyItem}>
            <Text className={styles.historyLabel}>最近回收时间</Text>
            <Text className={styles.historyValue}>
              {boxHistory.lastReturnTime ? formatSimpleDate(boxHistory.lastReturnTime) : '—'}
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
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📍</Text>
          选择节点类型
        </Text>
        <View className={styles.formCard}>
          <View className={styles.optionGrid}>
            {nodeTypeOptions.map(opt => (
              <View
                key={opt.key}
                className={classnames(styles.optionItem, selectedNodeType === opt.key && styles.active)}
                onClick={() => {
                  setSelectedNodeType(opt.key);
                  if (!nodeName) setNodeName(opt.label);
                }}
              >
                <Text className={styles.optionIcon}>{opt.icon}</Text>
                <Text className={styles.optionText}>{opt.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🔄</Text>
          选择操作状态
        </Text>
        <View className={styles.formCard}>
          <View className={styles.statusOptions}>
            {statusOptions.map(opt => (
              <Text
                key={opt.key}
                className={classnames(styles.statusOption, selectedStatus === opt.key && styles.active)}
                onClick={() => setSelectedStatus(opt.key)}
              >
                {opt.label}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {selectedStatus !== 'return' && (
        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📝</Text>
            填写打卡信息
          </Text>
          <View className={styles.formCard} style={{ padding: 0 }}>
            <View className={styles.formItem}>
              <Text className={styles.formLabel}>节点名称</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入节点名称"
                value={nodeName}
                onInput={e => setNodeName(e.detail.value)}
              />
            </View>
            <View className={styles.formItem}>
              <Text className={styles.formLabel}>签收人</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入签收人姓名"
                value={receiver}
                onInput={e => setReceiver(e.detail.value)}
              />
            </View>
          </View>
        </View>
      )}

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📷</Text>
          现场照片（选填，最多3张）
        </Text>
        <View className={styles.formCard}>
          <View className={styles.photoUploadArea}>
            <View className={styles.photoGrid}>
              {photos.map((photo, idx) => {
                const isRealPhoto = photo.startsWith('http') || photo.startsWith('file://') || photo.startsWith('tmp:');
                return (
                  <View
                    key={idx}
                    className={classnames(styles.photoItem, styles.hasPhoto)}
                  >
                    {isRealPhoto ? (
                      <Image
                        className={styles.realPhoto}
                        src={photo}
                        mode="aspectFill"
                        onClick={() => handlePreviewPhoto(idx)}
                      />
                    ) : (
                      <View className={styles.demoPhoto} onClick={() => handleRemovePhoto(idx)}>
                        <Text className={styles.photoIcon}>📷</Text>
                        <Text className={styles.photoText}>已上传</Text>
                      </View>
                    )}
                    <View className={styles.photoDelBtn} onClick={() => handleRemovePhoto(idx)}>
                      <Text className={styles.photoDelText}>×</Text>
                    </View>
                  </View>
                );
              })}
              {photos.length < 3 && (
                <View className={styles.photoItem} onClick={handlePhotoClick}>
                  <Text className={styles.photoIcon}>➕</Text>
                  <Text className={styles.photoText}>添加照片</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>💬</Text>
          备注说明（选填）
        </Text>
        <View className={styles.formCard}>
          <Textarea
            className={styles.remarkArea}
            placeholder="请输入备注信息..."
            value={remark}
            onInput={e => setRemark(e.detail.value)}
            maxlength={200}
          />
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
          确认打卡
        </Button>
      </View>
    </View>
  );
};

export default CheckinPage;
