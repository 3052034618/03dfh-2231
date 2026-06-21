import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import RecordCard from '@/components/RecordCard';
import EmptyState from '@/components/EmptyState';
import classnames from 'classnames';
import type { BoxStatus } from '@/types';
import styles from './index.module.scss';

type FilterType = 'all' | BoxStatus;

const filterOptions: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'normal', label: '正常' },
  { key: 'overdue', label: '超期' },
  { key: 'unreturned', label: '未归还' },
  { key: 'abnormal', label: '异常' }
];

const RecordsPage: React.FC = () => {
  const { records } = useApp();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchText, setSearchText] = useState('');

  useDidShow(() => {
    console.log('[Records] 页面显示，记录数：', records.length);
  });

  const filteredRecords = useMemo(() => {
    let result = records;
    if (activeFilter !== 'all') {
      result = result.filter(r => r.status === activeFilter);
    }
    if (searchText) {
      const keyword = searchText.toLowerCase();
      result = result.filter(r =>
        r.boxCode.toLowerCase().includes(keyword) ||
        r.routeName.toLowerCase().includes(keyword) ||
        r.ownerName.toLowerCase().includes(keyword)
      );
    }
    return result;
  }, [records, activeFilter, searchText]);

  const stats = useMemo(() => ({
    overdue: records.filter(r => r.status === 'overdue').length,
    unreturned: records.filter(r => r.status === 'unreturned').length,
    abnormal: records.filter(r => r.status === 'abnormal' || r.hasException).length
  }), [records]);

  return (
    <View className={styles.pageContainer}>
      <View className={styles.searchBar}>
        <View className={styles.searchInput} onClick={() => {
          Taro.showToast({ title: '搜索功能演示', icon: 'none' });
        }}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Text className={styles.searchPlaceholder}>搜索箱体编号、线路、货主</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.scrollContainer}>
        {stats.overdue > 0 || stats.unreturned > 0 || stats.abnormal > 0 ? (
          <View className={styles.statsRow}>
            {stats.overdue > 0 && (
              <View className={styles.statMini}>
                <Text className={classnames(styles.statValue, styles.warnColor)}>{stats.overdue}</Text>
                <Text className={styles.statLabel}>超期</Text>
              </View>
            )}
            {stats.unreturned > 0 && (
              <View className={styles.statMini}>
                <Text className={classnames(styles.statValue, styles.warnColor)}>{stats.unreturned}</Text>
                <Text className={styles.statLabel}>未归还</Text>
              </View>
            )}
            {stats.abnormal > 0 && (
              <View className={styles.statMini}>
                <Text className={classnames(styles.statValue, styles.errorColor)}>{stats.abnormal}</Text>
                <Text className={styles.statLabel}>异常</Text>
              </View>
            )}
          </View>
        ) : null}

        <View className={styles.filterTabs}>
          {filterOptions.map(option => (
            <Text
              key={option.key}
              className={classnames(styles.filterTab, activeFilter === option.key && styles.active)}
              onClick={() => setActiveFilter(option.key)}
            >
              {option.label}
            </Text>
          ))}
        </View>

        <View className={styles.listContainer}>
          {filteredRecords.length > 0 ? (
            filteredRecords.map(record => (
              <RecordCard key={record.id} record={record} />
            ))
          ) : (
            <EmptyState
              icon="📋"
              title="暂无周转记录"
              desc={activeFilter === 'all' ? '还没有创建任何周转记录' : '该状态下暂无记录'}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default RecordsPage;
