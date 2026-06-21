import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import StatusCard from '@/components/StatusCard';
import QuickAction from '@/components/QuickAction';
import RecordCard from '@/components/RecordCard';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const { records, userName, currentRole } = useApp();
  const [todayRecords, setTodayRecords] = useState(0);

  useDidShow(() => {
    console.log('[Home] 页面显示');
    const today = new Date().toISOString().slice(0, 10);
    const count = records.filter(r => r.createdAt.startsWith(today)).length;
    setTodayRecords(count);
  });

  const stats = {
    normal: records.filter(r => r.status === 'normal').length,
    warning: records.filter(r => r.status === 'overdue' || r.status === 'unreturned').length,
    error: records.filter(r => r.status === 'abnormal' || r.hasException).length,
    today: todayRecords
  };

  const recentRecords = records.slice(0, 3);

  return (
    <ScrollView scrollY className={styles.pageContainer} refresherEnabled onRefresherRefresh={() => {
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }}>
      <View className={styles.header}>
        <View className={styles.greeting}>
          <View className={styles.greetingText}>
            <Text className={styles.hello}>你好，欢迎回来</Text>
            <Text className={styles.userName}>{userName}</Text>
          </View>
          <View className={styles.roleTag}>
            <Text>{currentRole === 'driver' ? '冷链司机' : '交接员'}</Text>
          </View>
        </View>
        <View className={styles.statsRow}>
          <StatusCard title="今日任务" value={stats.today} subText="单" type="info" />
          <StatusCard title="在途箱体" value={stats.normal} subText="正常周转" type="normal" />
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text>快捷操作</Text>
        </View>
        <View className={styles.actionsGrid}>
          <QuickAction
            icon="📦"
            title="扫码建单"
            desc="装车前扫描箱体编号"
            color="blue"
            url="/pages/scan/index?mode=create"
          />
          <QuickAction
            icon="📍"
            title="节点打卡"
            desc="到达节点扫码打卡"
            color="green"
            url="/pages/scan/index?mode=checkin"
          />
          <QuickAction
            icon="⚠️"
            title="异常上报"
            desc="快速上报箱体异常"
            color="red"
            url="/pages/exception/index"
          />
          <QuickAction
            icon="📋"
            title="周转记录"
            desc="查看所有周转记录"
            color="orange"
            onClick={() => Taro.switchTab({ url: '/pages/records/index' })}
          />
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text>最近周转</Text>
          <Text
            className={styles.seeAll}
            onClick={() => Taro.switchTab({ url: '/pages/records/index' })}
          >
            查看全部 →
          </Text>
        </View>
        <View className={styles.recordsList}>
          {recentRecords.map(record => (
            <RecordCard key={record.id} record={record} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
