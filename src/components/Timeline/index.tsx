import React from 'react';
import { View, Text } from '@tarojs/components';
import type { TimelineNode } from '@/types';
import Tag from '../Tag';
import { nodeTypeMap, formatSimpleDate } from '@/utils';
import styles from './index.module.scss';
import classnames from 'classnames';

interface TimelineProps {
  nodes: TimelineNode[];
}

const getStatusColor = (status: string): 'primary' | 'success' | 'warning' | 'gray' => {
  switch (status) {
    case 'deliver': return 'success';
    case 'return': return 'primary';
    case 'storage': return 'warning';
    case 'recycle': return 'primary';
    default: return 'gray';
  }
};

const Timeline: React.FC<TimelineProps> = ({ nodes }) => {
  const sortedNodes = [...nodes].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <View className={styles.container}>
      {sortedNodes.map((node, index) => (
        <View key={node.id} className={styles.item}>
          <View className={styles.left}>
            <View className={classnames(styles.dot, index === 0 && styles.dotActive)} />
            {index < sortedNodes.length - 1 && <View className={styles.line} />}
          </View>
          <View className={styles.right}>
            <View className={styles.header}>
              <Tag text={node.statusText} color={getStatusColor(node.status)} size="sm" />
              <Text className={styles.nodeName}>
                {nodeTypeMap[node.nodeType]} · {node.nodeName}
              </Text>
            </View>
            <Text className={styles.time}>{formatSimpleDate(node.time)}</Text>
            <View className={styles.meta}>
              <Text className={styles.operator}>
                {node.operatorRole === 'driver' ? '司机' : '仓管员'}：{node.operator}
              </Text>
              {node.receiver && (
                <Text className={styles.receiver}>签收人：{node.receiver}</Text>
              )}
            </View>
            {node.remark && (
              <View className={styles.remark}>
                <Text className={styles.remarkText}>{node.remark}</Text>
              </View>
            )}
            {node.photos && node.photos.length > 0 && (
              <View className={styles.photos}>
                {node.photos.map((photo, pIdx) => (
                  <View key={pIdx} className={styles.photoWrap}>
                    <Text className={styles.photoIcon}>📷</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

export default Timeline;
