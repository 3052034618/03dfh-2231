import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { TimelineNode, NodeStatus } from '@/types';
import Tag from '../Tag';
import { nodeTypeMap, formatSimpleDate, nodeStatusSortPriority } from '@/utils';
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

const sortNodes = (nodes: TimelineNode[]): TimelineNode[] => {
  return [...nodes].sort((a, b) => {
    const priorityA = nodeStatusSortPriority[a.status as NodeStatus] ?? 99;
    const priorityB = nodeStatusSortPriority[b.status as NodeStatus] ?? 99;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    try {
      const timeA = new Date(a.time.replace(' ', 'T')).getTime();
      const timeB = new Date(b.time.replace(' ', 'T')).getTime();
      if (!isNaN(timeA) && !isNaN(timeB)) {
        return timeA - timeB;
      }
    } catch (e) {}

    return 0;
  });
};

const Timeline: React.FC<TimelineProps> = ({ nodes }) => {
  const sortedNodes = sortNodes(nodes);

  const handlePhotoClick = (photo: string, allPhotos: string[]) => {
    const realPhotos = allPhotos.filter(p => p.startsWith('http') || p.startsWith('file://') || p.startsWith('tmp:'));
    if (realPhotos.length > 0) {
      Taro.previewImage({
        current: photo,
        urls: realPhotos
      });
    }
  };

  return (
    <View className={styles.container}>
      {sortedNodes.map((node, index) => (
        <View key={node.id} className={styles.item}>
          <View className={styles.left}>
            <View className={classnames(styles.dot, index === sortedNodes.length - 1 && styles.dotActive)} />
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
                {node.operatorRole === 'driver' ? '司机' : node.operatorRole === 'dispatcher' ? '调度员' : '仓管员'}：{node.operator}
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
                {node.photos.map((photo, pIdx) => {
                  const isRealPhoto = photo.startsWith('http') || photo.startsWith('file://') || photo.startsWith('tmp:');
                  return (
                    <View key={pIdx} className={styles.photoWrap}>
                      {isRealPhoto ? (
                        <Image
                          className={styles.photoImg}
                          src={photo}
                          mode="aspectFill"
                          onClick={() => handlePhotoClick(photo, node.photos!)}
                        />
                      ) : (
                        <Text className={styles.photoIcon}>📷</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

export default Timeline;
