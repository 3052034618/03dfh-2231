import React, { useState, useMemo } from 'react';
import { View, Text, Picker, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import classnames from 'classnames';
import { handleResultMap, handleProgressMap, nodeTypeMap, nodeStatusMap } from '@/utils';
import type { TurnoverRecord, ExceptionRecord } from '@/types';
import styles from './index.module.scss';

const DataExportPage: React.FC = () => {
  const { exportRecordsByDate, records, exceptions } = useApp();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewType, setPreviewType] = useState<'records' | 'exceptions'>('records');
  const [previewContent, setPreviewContent] = useState('');

  useDidShow(() => {
    if (!startDate || !endDate) {
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      setStartDate(lastWeek.toISOString().slice(0, 10));
      setEndDate(today.toISOString().slice(0, 10));
    }
  });

  const exportData = useMemo(() => {
    if (!startDate || !endDate) {
      return { records: [], exceptions: [], summary: { total: 0, normal: 0, abnormal: 0, exceptionCount: 0 } };
    }
    return exportRecordsByDate(startDate, endDate);
  }, [exportRecordsByDate, startDate, endDate]);

  const handleQuickDate = (days: number) => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - days);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(today.toISOString().slice(0, 10));
  };

  const generateRecordsCSV = (recordList: TurnoverRecord[]): string => {
    const headers = ['箱体编号', '箱体类型', '承运线路', '货主', '司机', '状态', '创建时间', '预计到达', '实际到达', '节点数', '是否有异常', '异常说明', '节点详情'];
    const rows = recordList.map(r => [
      r.boxCode,
      r.boxType,
      r.routeName,
      r.ownerName,
      r.driverName,
      r.status === 'normal' ? '正常' : r.status === 'abnormal' ? '异常' : r.status === 'overdue' ? '超期' : '未归还',
      r.createdAt,
      r.estimatedArrival,
      r.actualArrival || '-',
      r.nodes.length,
      r.hasException ? '是' : '否',
      r.exceptionDesc || '-',
      r.nodes.map(n => `${nodeTypeMap[n.nodeType] || n.nodeType}-${nodeStatusMap[n.status] || n.status}(${n.nodeName})`).join(' | ')
    ]);
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const generateExceptionsCSV = (exceptionList: ExceptionRecord[]): string => {
    const headers = ['箱体编号', '异常类型', '异常描述', '上报人', '上报人角色', '上报时间', '处理状态', '当前进度', '处理结果', '处理人', '处理时间', '处理说明'];
    const rows = exceptionList.map(e => [
      e.boxCode,
      e.typeText,
      e.description,
      e.reporter,
      e.reporterRole === 'driver' ? '司机' : e.reporterRole === 'dispatcher' ? '调度员' : '交接员',
      e.createdAt,
      e.handled ? '已处理' : '待处理',
      e.currentProgressText,
      e.handleResult ? handleResultMap[e.handleResult] : '-',
      e.handledBy || '-',
      e.handledAt || '-',
      e.handleDesc || '-'
    ]);
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const handlePreviewRecords = () => {
    if (exportData.records.length === 0) {
      Taro.showToast({ title: '暂无周转记录', icon: 'none' });
      return;
    }
    const csv = generateRecordsCSV(exportData.records);
    setPreviewContent(csv);
    setPreviewType('records');
    setShowPreview(true);
  };

  const handlePreviewExceptions = () => {
    if (exportData.exceptions.length === 0) {
      Taro.showToast({ title: '暂无异常记录', icon: 'none' });
      return;
    }
    const csv = generateExceptionsCSV(exportData.exceptions);
    setPreviewContent(csv);
    setPreviewType('exceptions');
    setShowPreview(true);
  };

  const handleCopyToClipboard = () => {
    Taro.setClipboardData({
      data: previewContent,
      success: () => {
        Taro.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  };

  const handleExportAll = () => {
    if (exportData.records.length === 0 && exportData.exceptions.length === 0) {
      Taro.showToast({ title: '暂无数据可导出', icon: 'none' });
      return;
    }

    const recordsCSV = exportData.records.length > 0 ? generateRecordsCSV(exportData.records) : '';
    const exceptionsCSV = exportData.exceptions.length > 0 ? generateExceptionsCSV(exportData.exceptions) : '';

    let fullContent = '';
    if (recordsCSV) {
      fullContent += '===== 周转记录 =====\n' + recordsCSV + '\n\n';
    }
    if (exceptionsCSV) {
      fullContent += '===== 异常记录 =====\n' + exceptionsCSV + '\n';
    }

    Taro.setClipboardData({
      data: fullContent,
      success: () => {
        Taro.showModal({
          title: '导出成功',
          content: `共 ${exportData.summary.total} 条周转记录，${exportData.summary.exceptionCount} 条异常记录，已复制到剪贴板，可粘贴到表格或文档中。`,
          showCancel: false,
          confirmText: '知道了'
        });
      }
    });
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📅</Text>
          选择日期范围
        </Text>
        <View className={styles.card}>
          <View className={styles.dateRow}>
            <View className={styles.dateItem}>
              <Text className={styles.dateLabel}>开始日期</Text>
              <Picker mode="date" value={startDate} onChange={e => setStartDate(e.detail.value)}>
                <View className={styles.datePicker}>
                  <Text className={styles.dateText}>{startDate || '请选择'}</Text>
                  <Text className={styles.dateArrow}>›</Text>
                </View>
              </Picker>
            </View>
            <View className={styles.dateItem}>
              <Text className={styles.dateLabel}>结束日期</Text>
              <Picker mode="date" value={endDate} onChange={e => setEndDate(e.detail.value)}>
                <View className={styles.datePicker}>
                  <Text className={styles.dateText}>{endDate || '请选择'}</Text>
                  <Text className={styles.dateArrow}>›</Text>
                </View>
              </Picker>
            </View>
          </View>

          <View className={styles.quickDates}>
            <View
              className={classnames(styles.quickDateBtn)}
              onClick={() => handleQuickDate(7)}
            >
              近7天
            </View>
            <View
              className={classnames(styles.quickDateBtn)}
              onClick={() => handleQuickDate(30)}
            >
              近30天
            </View>
            <View
              className={classnames(styles.quickDateBtn)}
              onClick={() => handleQuickDate(90)}
            >
              近90天
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📊</Text>
          数据概览
        </Text>
        <View className={styles.summaryCards}>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryValue}>{exportData.summary.total}</Text>
            <Text className={styles.summaryLabel}>周转总单</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={classnames(styles.summaryValue, styles.summarySuccess)}>
              {exportData.summary.normal}
            </Text>
            <Text className={styles.summaryLabel}>正常完成</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={classnames(styles.summaryValue, styles.summaryWarning)}>
              {exportData.summary.total - exportData.summary.normal}
            </Text>
            <Text className={styles.summaryLabel}>在途/其他</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={classnames(styles.summaryValue, styles.summaryDanger)}>
              {exportData.summary.exceptionCount}
            </Text>
            <Text className={styles.summaryLabel}>异常数量</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📤</Text>
          导出数据
        </Text>
        <View className={styles.exportSection}>
          <Button className={styles.exportBtn} onClick={handleExportAll}>
            <Text className={styles.exportBtnIcon}>📋</Text>
            一键导出全部数据
          </Button>
          <Button
            className={classnames(styles.exportBtn, styles.secondary)}
            onClick={handlePreviewRecords}
          >
            <Text className={styles.exportBtnIcon}>🔍</Text>
            预览周转记录（{exportData.summary.total}）
          </Button>
          <Button
            className={classnames(styles.exportBtn, styles.secondary)}
            onClick={handlePreviewExceptions}
          >
            <Text className={styles.exportBtnIcon}>🔍</Text>
            预览异常记录（{exportData.summary.exceptionCount}）
          </Button>
        </View>
      </View>

      {showPreview && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📄</Text>
            {previewType === 'records' ? '周转记录预览' : '异常记录预览'}
          </Text>
          <View className={styles.previewBox}>
            <View className={styles.previewHeader}>
              <Text className={styles.previewTitle}>
                {previewType === 'records' ? '周转记录 CSV' : '异常记录 CSV'}
              </Text>
              <Text className={styles.previewCount}>
                {previewType === 'records'
                  ? `${exportData.summary.total} 条`
                  : `${exportData.summary.exceptionCount} 条`}
              </Text>
            </View>
            <ScrollView scrollY scrollX className={styles.previewContent}>
              {previewContent}
            </ScrollView>
            <View className={styles.previewFooter}>
              <Button
                className={classnames(styles.previewBtn, styles.secondary)}
                onClick={() => setShowPreview(false)}
              >
                关闭
              </Button>
              <Button
                className={classnames(styles.previewBtn, styles.primary)}
                onClick={handleCopyToClipboard}
              >
                复制全部
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default DataExportPage;
