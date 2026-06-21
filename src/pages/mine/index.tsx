import React, { useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import classnames from 'classnames';
import type { UserRole } from '@/types';
import { userRoleMap } from '@/utils';
import styles from './index.module.scss';

const driverMenuItems = [
  { icon: '📋', title: '我的任务', desc: '查看分配的运输任务', color: 'iconBlue' },
  { icon: '🚚', title: '车辆信息', desc: '绑定的冷链车辆', color: 'iconGreen' },
  { icon: '🔔', title: '消息通知', desc: '异常提醒和系统通知', color: 'iconOrange' },
  { icon: '❓', title: '帮助中心', desc: '使用指南和常见问题', color: 'iconGray' },
  { icon: '⚙️', title: '系统设置', desc: '应用设置和偏好', color: 'iconGray' }
];

const dispatcherMenuItems = [
  { icon: '⚠️', title: '异常待处理', desc: '司机上报的箱体异常', color: 'iconRed', action: 'exception-list' as const },
  { icon: '📊', title: '数据统计', desc: '周转数据和报表', color: 'iconBlue' },
  { icon: '👥', title: '人员管理', desc: '司机和交接员管理', color: 'iconGreen' },
  { icon: '📦', title: '箱体管理', desc: '低温箱信息管理', color: 'iconOrange' },
  { icon: '❓', title: '帮助中心', desc: '使用指南和常见问题', color: 'iconGray' },
  { icon: '⚙️', title: '系统设置', desc: '应用设置和偏好', color: 'iconGray' }
];

const operatorMenuItems = [
  { icon: '📋', title: '交接任务', desc: '待处理的交接任务', color: 'iconBlue' },
  { icon: '📦', title: '库存管理', desc: '现场箱体库存', color: 'iconGreen' },
  { icon: '🔔', title: '消息通知', desc: '异常提醒和系统通知', color: 'iconOrange' },
  { icon: '❓', title: '帮助中心', desc: '使用指南和常见问题', color: 'iconGray' },
  { icon: '⚙️', title: '系统设置', desc: '应用设置和偏好', color: 'iconGray' }
];

const roleOptions: { key: UserRole; label: string }[] = [
  { key: 'driver', label: '冷链司机' },
  { key: 'operator', label: '交接员' },
  { key: 'dispatcher', label: '调度员' }
];

const MinePage: React.FC = () => {
  const { userName, currentRole, setCurrentRole, records, exceptions } = useApp();

  const myRecords = records.filter(r => r.driverName === userName);
  const completedCount = myRecords.filter(r => r.status === 'normal' && r.nodes.some(n => n.status === 'return')).length;
  const exceptionCount = exceptions.filter(e => e.reporter === userName).length;
  const pendingExceptionCount = exceptions.filter(e => !e.handled).length;

  const stats = useMemo(() => {
    if (currentRole === 'dispatcher') {
      return [
        { value: pendingExceptionCount, label: '待处理异常' },
        { value: records.length, label: '总周转单' },
        { value: exceptions.length, label: '异常总数' }
      ];
    }
    return [
      { value: myRecords.length, label: '总周转' },
      { value: completedCount, label: '已完成' },
      { value: exceptionCount, label: '异常上报' }
    ];
  }, [currentRole, myRecords.length, completedCount, exceptionCount, pendingExceptionCount, records.length, exceptions.length]);

  const currentMenu = useMemo(() => {
    if (currentRole === 'dispatcher') return dispatcherMenuItems;
    if (currentRole === 'operator') return operatorMenuItems;
    return driverMenuItems;
  }, [currentRole]);

  const handleRoleSwitch = (role: UserRole) => {
    setCurrentRole(role);
  };

  const handleMenuClick = (item: typeof currentMenu[number]) => {
    if ('action' in item && item.action === 'exception-list') {
      Taro.navigateTo({ url: '/pages/exception-list/index' });
      return;
    }
    Taro.showToast({ title: `${item.title}功能开发中`, icon: 'none' });
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.header}>
        <View className={styles.userCard}>
          <View className={styles.avatar}>
            <Text>{currentRole === 'dispatcher' ? '👨‍💼' : currentRole === 'operator' ? '👷' : '👨‍✈️'}</Text>
          </View>
          <View className={styles.userInfo}>
            <Text className={styles.userName}>{userName}</Text>
            <Text className={styles.userRole}>
              {userRoleMap[currentRole]} · {currentRole === 'driver' ? 'D001' : currentRole === 'operator' ? 'O001' : 'S001'}
            </Text>
            <View className={styles.roleSwitch}>
              {roleOptions.map(opt => (
                <Button
                  key={opt.key}
                  className={classnames(styles.roleBtn, currentRole === opt.key && styles.active)}
                  onClick={() => handleRoleSwitch(opt.key)}
                >
                  {opt.label}
                </Button>
              ))}
            </View>
          </View>
        </View>

        <View className={styles.statsRow}>
          {stats.map((stat, idx) => (
            <View key={idx} className={styles.statItem}>
              <Text className={styles.statValue}>{stat.value}</Text>
              <Text className={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {currentRole === 'dispatcher' && pendingExceptionCount > 0 && (
        <View className={styles.pendingAlert} onClick={() => Taro.navigateTo({ url: '/pages/exception-list/index' })}>
          <View className={styles.alertIcon}>⚠️</View>
          <View className={styles.alertContent}>
            <Text className={styles.alertTitle}>有 {pendingExceptionCount} 条异常待处理</Text>
            <Text className={styles.alertDesc}>点击查看司机上报的箱体异常</Text>
          </View>
          <Text className={styles.alertArrow}>›</Text>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>功能菜单</Text>
        <View className={styles.menuCard}>
          {currentMenu.map((item, idx) => (
            <View
              key={idx}
              className={styles.menuItem}
              onClick={() => handleMenuClick(item)}
            >
              <View className={classnames(styles.menuIcon, item.color)}>
                <Text>{item.icon}</Text>
              </View>
              <View className={styles.menuContent}>
                <View style={{ display: 'flex', alignItems: 'center', gap: '16rpx' }}>
                  <Text className={styles.menuTitle}>{item.title}</Text>
                  {item.title === '异常待处理' && pendingExceptionCount > 0 && (
                    <View className={styles.badge}>
                      <Text className={styles.badgeText}>{pendingExceptionCount}</Text>
                    </View>
                  )}
                </View>
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
