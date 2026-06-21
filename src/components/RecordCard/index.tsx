import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { TurnoverRecord } from '@/types';
import Tag from '../Tag';
import { boxStatusMap, formatSimpleDate } from '@/utils';
import styles from './index.module.scss';
import classnames from 'classnames';

interface RecordCardProps {
  record: TurnoverRecord;
  onClick?: () => void;
}

const RecordCard: React.FC<RecordCardProps> = ({ record, onClick }) => {
  const statusColor = record.status === 'normal' ? 'success' 
    : record.status === 'abnormal' ? 'error' 
    : 'warning';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/record-detail/index?id=${record.id}`
      });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.boxInfo}>
          <Text className={styles.boxCode}>{record.boxCode}</Text>
          <Tag 
            text={boxStatusMap[record.status]} 
            color={statusColor}
            size="sm"
          />
        </View>
        {record.hasException && (
          <Tag text="异常" color="error" size="sm" />
        )}
      </View>

      <View className={styles.routeRow}>
        <View className={styles.routeIcon}>
          <Text className={styles.dot}>●</Text>
          <View className={styles.line}></View>
          <Text className={classnames(styles.dot, styles.dotEnd)}>●</Text>
        </View>
        <View className={styles.routeContent}>
          <Text className={styles.routeText}>{record.routeName}</Text>
        </View>
      </View>

      <View className={styles.infoRow}>
        <View className={styles.infoItem}>
          <Text className={styles.label}>货主</Text>
          <Text className={styles.value}>{record.ownerName}</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.label}>司机</Text>
          <Text className={styles.value}>{record.driverName}</Text>
        </View>
      </View>

      <View className={styles.footer}>
        <Text className={styles.time}>
          更新：{formatSimpleDate(record.updatedAt)}
        </Text>
        <Text className={styles.nodeCount}>
          已过 {record.nodes.length} 个节点
        </Text>
      </View>
    </View>
  );
};

export default RecordCard;
