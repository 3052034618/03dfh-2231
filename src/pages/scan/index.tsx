import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import Tag from '@/components/Tag';
import classnames from 'classnames';
import styles from './index.module.scss';

type ScanMode = 'create' | 'checkin';

const recentDemoScans = [
  { code: 'BOX-2024-0001', time: '10分钟前', status: 'normal' as const },
  { code: 'BOX-2024-0005', time: '30分钟前', status: 'normal' as const },
  { code: 'BOX-2024-0002', time: '1小时前', status: 'abnormal' as const }
];

const ScanPage: React.FC = () => {
  const router = useRouter();
  const { boxes } = useApp();
  const [mode, setMode] = useState<ScanMode>(router.params.mode === 'checkin' ? 'checkin' : 'create');

  useDidShow(() => {
    console.log('[Scan] 页面显示，模式：', mode);
    if (router.params.mode === 'checkin') {
      setMode('checkin');
    }
  });

  const modeTip = useMemo(() => mode === 'create'
    ? { title: '扫码建单', desc: '扫描箱体二维码或条形码，开始创建周转记录' }
    : { title: '节点打卡', desc: '扫描箱体二维码，进行节点打卡和状态更新' }
  , [mode]);

  const handleScan = async () => {
    try {
      console.log('[Scan] 开始扫码...');
      Taro.showLoading({ title: '扫码中...' });
      await new Promise(resolve => setTimeout(resolve, 1500));
      Taro.hideLoading();

      const mockCode = 'BOX-2024-0001';
      const foundBox = boxes.find(b => b.code === mockCode);

      if (foundBox && (foundBox.status === 'abnormal' || foundBox.status === 'overdue' || foundBox.status === 'unreturned')) {
        Taro.showModal({
          title: '箱体状态提醒',
          content: `该箱体${foundBox.status === 'abnormal' ? '存在异常记录' : foundBox.status === 'overdue' ? '已超期' : '未归还'}${foundBox.lastExceptionDesc ? `：${foundBox.lastExceptionDesc}` : ''}，是否继续？`,
          confirmText: '继续操作',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              proceedNext(mockCode);
            }
          }
        });
      } else {
        Taro.showToast({ title: `扫描成功：${mockCode}`, icon: 'success' });
        setTimeout(() => proceedNext(mockCode), 500);
      }
    } catch (err) {
      console.error('[Scan] 扫码失败：', err);
      Taro.hideLoading();
      Taro.showToast({ title: '扫码失败，请重试', icon: 'none' });
    }
  };

  const proceedNext = (boxCode: string) => {
    if (mode === 'create') {
      Taro.navigateTo({
        url: `/pages/create-order/index?boxCode=${boxCode}`
      });
    } else {
      Taro.navigateTo({
        url: `/pages/checkin/index?boxCode=${boxCode}`
      });
    }
  };

  const handleManualInput = () => {
    Taro.showActionSheet({
      itemList: ['BOX-2024-0001', 'BOX-2024-0002', 'BOX-2024-0003', 'BOX-2024-0004', 'BOX-2024-0005'],
      success: (res) => {
        const codes = ['BOX-2024-0001', 'BOX-2024-0002', 'BOX-2024-0003', 'BOX-2024-0004', 'BOX-2024-0005'];
        proceedNext(codes[res.tapIndex]);
      }
    });
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

      <View className={styles.recentScans}>
        <Text className={styles.sectionTitle}>最近扫描</Text>
        <View className={styles.scanHistory}>
          {recentDemoScans.map((item, idx) => (
            <View
              key={idx}
              className={styles.historyItem}
              onClick={() => proceedNext(item.code)}
            >
              <View className={styles.historyLeft}>
                <View className={styles.historyIcon}>
                  <Text>📦</Text>
                </View>
                <View className={styles.historyInfo}>
                  <View style={{ display: 'flex', alignItems: 'center', gap: '16rpx' }}>
                    <Text className={styles.historyCode}>{item.code}</Text>
                    <Tag
                      text={item.status === 'normal' ? '正常' : item.status === 'abnormal' ? '异常' : '超期'}
                      color={item.status === 'normal' ? 'success' : 'error'}
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
    </View>
  );
};

export default ScanPage;
