import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import classnames from 'classnames';
import type { UserRole } from '@/types';
import styles from './index.module.scss';

const menuItems = [
  { icon: '📋', title: '我的任务', desc: '查看分配的运输任务', color: 'iconBlue' },
  { icon: '🚚', title: '车辆信息', desc: '绑定的冷链车辆', color: 'iconGreen' },
  { icon: '🔔', title: '消息通知', desc: '异常提醒和系统通知', color: 'iconOrange' },
  { icon: '❓', title: '帮助中心', desc: '使用指南和常见问题', color: 'iconGray' },
  { icon: '⚙️', title: '系统设置', desc: '应用设置和偏好', color: 'iconGray' }
];

const MinePage: React.FC = () => {
  const { userName, currentRole, setCurrentRole, records } = useApp();

  const myRecords = records.filter(r => r.driverName === userName);
  const completedCount = myRecords.filter(r => r.status === 'normal' && r.nodes.some(n => n.status === 'return')).length;
  const exceptionCount = myRecords.filter(r => r.hasException).length;

  const handleRoleSwitch = (role: UserRole) => {
    setCurrentRole(role);
    Taro.showToast({ title: `已切换为${role === 'driver' ? '冷链司机' : '交接员'}`, icon: 'success' });
  };

  const handleMenuClick = (title: string) => {
    Taro.showToast({ title: `${title}功能开发中`, icon: 'none' });
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.header}>
        <View className={styles.userCard}>
          <View className={styles.avatar}>
            <Text>👤</Text>
          </View>
          <View className={styles.userInfo}>
            <Text className={styles.userName}>{userName}</Text>
            <Text className={styles.userRole}>
              {currentRole === 'driver' ? '冷链司机 · D001' : '现场交接员 · O001'}
            </Text>
            <View className={styles.roleSwitch}>
              <Button
                className={classnames(styles.roleBtn, currentRole === 'driver' && styles.active)}
                onClick={() => handleRoleSwitch('driver')}
              >
                冷链司机
              </Button>
              <Button
                className={classnames(styles.roleBtn, currentRole === 'operator' && styles.active)}
                onClick={() => handleRoleSwitch('operator')}
              >
                交接员
              </Button>
            </View>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{myRecords.length}</Text>
            <Text className={styles.statLabel}>总周转</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{completedCount}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{exceptionCount}</Text>
            <Text className={styles.statLabel}>异常上报</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>功能菜单</Text>
        <View className={styles.menuCard}>
          {menuItems.map((item, idx) => (
            <View
              key={idx}
              className={styles.menuItem}
              onClick={() => handleMenuClick(item.title)}
            >
              <View className={classnames(styles.menuIcon, item.color)}>
                <Text>{item.icon}</Text>
              </View>
              <View className={styles.menuContent}>
                <Text className={styles.menuTitle}>{item.title}</Text>
                <Text className={styles.menuDesc}>{item.desc}</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default MinePage;
