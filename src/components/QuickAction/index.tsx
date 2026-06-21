import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';

interface QuickActionProps {
  icon: string;
  title: string;
  desc?: string;
  color: 'blue' | 'green' | 'orange' | 'red';
  onClick?: () => void;
  url?: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, title, desc, color, onClick, url }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (url) {
      Taro.navigateTo({ url });
    }
  };

  return (
    <View className={classnames(styles.action, styles[color])} onClick={handleClick}>
      <View className={styles.iconWrap}>
        <Text className={styles.icon}>{icon}</Text>
      </View>
      <View className={styles.content}>
        <Text className={styles.title}>{title}</Text>
        {desc && <Text className={styles.desc}>{desc}</Text>}
      </View>
    </View>
  );
};

export default QuickAction;
