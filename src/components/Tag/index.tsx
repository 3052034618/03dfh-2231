import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface TagProps {
  text: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

const Tag: React.FC<TagProps> = ({ text, color = 'primary', size = 'md', className }) => {
  return (
    <View className={classnames(styles.tag, styles[color], styles[size], className)}>
      <Text className={styles.text}>{text}</Text>
    </View>
  );
};

export default Tag;
