import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface StatusCardProps {
  title: string;
  value: number | string;
  subText?: string;
  type: 'normal' | 'warning' | 'error' | 'info';
}

const StatusCard: React.FC<StatusCardProps> = ({ title, value, subText, type }) => {
  return (
    <View className={styles[type]}>
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.value}>{value}</Text>
      {subText && <Text className={styles.subText}>{subText}</Text>}
    </View>
  );
};

export default StatusCard;
