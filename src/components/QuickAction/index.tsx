import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { storage } from '@/utils';
import styles from './index.module.scss';

interface QuickActionProps {
  icon: string;
  title: string;
  desc?: string;
  color: 'blue' | 'green' | 'orange' | 'red';
  onClick?: () => void;
  url?: string;
  isTabBar?: boolean;
}

const TAB_BAR_PAGES = [
  '/pages/home/index',
  '/pages/records/index',
  '/pages/scan/index',
  '/pages/mine/index'
];

const QuickAction: React.FC<QuickActionProps> = ({ icon, title, desc, color, onClick, url, isTabBar }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    if (url) {
      const cleanUrl = url.split('?')[0];
      const hasQuery = url.includes('?');
      const queryStr = hasQuery ? url.split('?')[1] : '';

      const isTab = isTabBar || TAB_BAR_PAGES.some(p => cleanUrl.includes(p));

      console.log('[QuickAction] 跳转:', url, 'isTabBar:', isTab);

      if (isTab) {
        if (hasQuery) {
          storage.set('scan_page_params', queryStr);
        }
        Taro.switchTab({
          url: cleanUrl,
          fail: (err) => {
            console.error('[QuickAction] switchTab 失败:', err);
            Taro.navigateTo({ url }).catch(() => {});
          }
        });
      } else {
        Taro.navigateTo({
          url,
          fail: (err) => {
            console.error('[QuickAction] navigateTo 失败:', err);
            Taro.showToast({ title: '页面跳转失败', icon: 'none' });
          }
        });
      }
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
