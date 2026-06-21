import React, { useState } from 'react';
import { View, Text, Button, Textarea } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import classnames from 'classnames';
import type { ExceptionType } from '@/types';
import { exceptionTypeMap, generateId } from '@/utils';
import styles from './index.module.scss';

const exceptionTypeList: { key: ExceptionType; name: string; desc: string }[] = [
  { key: 'damaged', name: '箱体破损', desc: '箱体有裂缝、变形、破损等情况' },
  { key: 'ice_pack_missing', name: '冰排缺失', desc: '冰排数量不足或完全缺失' },
  { key: 'temp_tag_changed', name: '温度标签变色', desc: '温度指示标签已变色，温度超标' },
  { key: 'other', name: '其他异常', desc: '其他需要上报的异常情况' }
];

const ExceptionPage: React.FC = () => {
  const router = useRouter();
  const { boxes, records, addException, userName, currentRole, updateRecord } = useApp();
  const initialBoxCode = router.params.boxCode || '';

  const [selectedBoxCode, setSelectedBoxCode] = useState(initialBoxCode);
  const [selectedType, setSelectedType] = useState<ExceptionType>('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  useDidShow(() => {
    console.log('[Exception] 页面显示，预设箱体：', initialBoxCode);
  });

  const canSubmit = selectedBoxCode && selectedType && (description.trim().length > 0 || photos.length > 0);

  const handleSelectBox = () => {
    const boxCodes = boxes.slice(0, 10).map(b => b.code);
    Taro.showActionSheet({
      itemList: boxCodes,
      success: (res) => {
        setSelectedBoxCode(boxCodes[res.tapIndex]);
      }
    });
  };

  const handlePhotoClick = () => {
    if (photos.length >= 6) {
      Taro.showToast({ title: '最多上传6张照片', icon: 'none' });
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
      Taro.showToast({ title: '请完整填写异常信息', icon: 'none' });
      return;
    }

    const currentRecord = records.find(r => r.boxCode === selectedBoxCode);

    addException({
      boxCode: selectedBoxCode,
      recordId: currentRecord?.id || '',
      type: selectedType,
      typeText: exceptionTypeMap[selectedType],
      description: description.trim(),
      photos,
      reporter: userName,
      reporterRole: currentRole
    });

    if (currentRecord) {
      updateRecord(currentRecord.id, {
        status: 'abnormal',
        hasException: true,
        exceptionDesc: `${exceptionTypeMap[selectedType]}：${description.trim()}`
      });
    }

    Taro.showToast({ title: '异常已上报，调度员将尽快处理', icon: 'success', duration: 2000 });
    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.warnBanner}>
        <Text className={styles.warnIcon}>⚠️</Text>
        <View className={styles.warnContent}>
          <Text className={styles.warnTitle}>异常请立即上报</Text>
          <Text className={styles.warnDesc}>及时上报箱体异常情况，调度员将根据情况决定是否换箱或暂停周转</Text>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📦</Text>
          选择异常箱体
        </Text>
        <View className={styles.formCard} style={{ padding: 0 }}>
          <View className={styles.boxSelector} onClick={handleSelectBox}>
            <Text className={styles.selectorLabel}>箱体编号</Text>
            <Text className={classnames(styles.selectorValue, !selectedBoxCode && { color: '#86909C' })}>
              {selectedBoxCode || '点击选择箱体编号'}
            </Text>
            <Text className={styles.selectorArrow}>›</Text>
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🔴</Text>
          选择异常类型
        </Text>
        <View className={styles.formCard}>
          <View className={styles.typeList}>
            {exceptionTypeList.map(item => (
              <View
                key={item.key}
                className={classnames(styles.typeItem, selectedType === item.key && styles.active)}
                onClick={() => setSelectedType(item.key)}
              >
                <View className={styles.typeRadio}>
                  <View className={styles.typeRadioInner} />
                </View>
                <View className={styles.typeContent}>
                  <Text className={styles.typeName}>{item.name}</Text>
                  <Text className={styles.typeDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📷</Text>
          上传照片证据（选填，最多6张）
        </Text>
        <View className={styles.formCard}>
          <View className={styles.photoUploadArea}>
            <View className={styles.photoGrid}>
              {photos.map((_, idx) => (
                <View key={idx} className={styles.photoItemWrap}>
                  <View
                    className={classnames(styles.photoItem, styles.hasPhoto)}
                    onClick={() => handleRemovePhoto(idx)}
                  >
                    <Text className={styles.photoIcon}>📷</Text>
                    <Text className={styles.photoText}>已上传 {idx + 1}</Text>
                  </View>
                  <Text className={styles.photoDel} onClick={() => handleRemovePhoto(idx)}>×</Text>
                </View>
              ))}
              {photos.length < 6 && (
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
          详细描述
        </Text>
        <View className={styles.formCard}>
          <Textarea
            className={styles.remarkArea}
            placeholder="请详细描述异常情况，如：箱体破损位置、冰排缺失数量、温度标签变色程度等..."
            value={description}
            onInput={e => setDescription(e.detail.value)}
            maxlength={500}
          />
          <View className={styles.charCount}>
            <Text>{description.length}/500</Text>
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
          提交上报
        </Button>
      </View>
    </View>
  );
};

export default ExceptionPage;
