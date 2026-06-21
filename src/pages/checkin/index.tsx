import React, { useState, useMemo } from 'react';
import { View, Text, Button, Input, Textarea } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import Tag from '@/components/Tag';
import classnames from 'classnames';
import type { NodeType, NodeStatus } from '@/types';
import { nodeTypeMap, nodeStatusMap, generateId, boxStatusMap } from '@/utils';
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
  const { records, addNodeToRecord, userName, currentRole, updateRecord } = useApp();
  const boxCode = router.params.boxCode || 'BOX-2024-0001';

  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>('');
  const [selectedStatus, setSelectedStatus] = useState<NodeStatus>('');
  const [nodeName, setNodeName] = useState('');
  const [receiver, setReceiver] = useState('');
  const [remark, setRemark] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const currentRecord = useMemo(() => records.find(r => r.boxCode === boxCode), [records, boxCode]);

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
    if (photos.length >= 3) {
      Taro.showToast({ title: '最多上传3张照片', icon: 'none' });
      return;
    }
    Taro.showToast({ title: '拍照功能演示', icon: 'none' });
    setPhotos(prev => [...prev, `photo_${Date.now()}`]);
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
              {photos.map((_, idx) => (
                <View
                  key={idx}
                  className={classnames(styles.photoItem, styles.hasPhoto)}
                  onClick={() => handleRemovePhoto(idx)}
                >
                  <Text className={styles.photoIcon}>📷</Text>
                  <Text className={styles.photoText}>已上传</Text>
                </View>
              ))}
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
