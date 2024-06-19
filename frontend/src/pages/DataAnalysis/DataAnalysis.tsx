import { ProCard, StatisticCard } from '@ant-design/pro-components';
import RcResizeObserver from 'rc-resize-observer';
import React, { useEffect } from 'react';
import { useState } from 'react';
import dayjs from 'dayjs';
import { TodoItem, TodoActivity } from '../TodoList/TodoList';
import HttpUtil from '../../utils/HttpUtil';
import ApiUtil from '../../utils/ApiUtil';
import { message } from 'antd';
import { Pie } from '@ant-design/plots';

const { Statistic } = StatisticCard;

export default () => {
  const [responsive, setResponsive] = useState(false);
  const [activityListWithItems, setActivityListWithItems] = useState<TodoActivity[]>([]);

  const Today: string = dayjs().format('YYYY年MM月DD日 dddd');


  const getItemsByActivity = async (activityID: number) => {
    try {
      const response = await HttpUtil.get(`${ApiUtil.API_Item_LIST_BY_ACTIVITY}${activityID}`);
      // console.log("getItemsByActivity:" + response);
      return response as TodoItem[];
    } catch (error: any) {
      message.error(error);
      return [];
    }
  };

  const getData = async () => {
    const response = await HttpUtil.get(ApiUtil.API_Activity_LIST + localStorage.getItem("userID"));
    const activityList = response as TodoActivity[];
    const activityListWithItems = await Promise.all(
      activityList.map(async (activity) => {
        const items = await getItemsByActivity(activity.ActivityID);
        return { ...activity, items };
      })
    );
    setActivityListWithItems(activityListWithItems);
  };

  useEffect(() => {
    getData();
  }, []);

  console.log('Activity List With Items:', activityListWithItems);
  // 计算今日 Activity 总数
  const todayActivityCount = activityListWithItems.filter((activity) => {
    const today = dayjs();
    const startDate = dayjs(activity.ActivityBeginDate);
    const endDate = dayjs(activity.ActivityEndDate);
    return today.isSame(startDate, 'day') || today.isSame(endDate, 'day') || (today.isAfter(startDate) && today.isBefore(endDate));
  }).length;

  // 计算当月日平均 Activity 数
  const currentMonthActivityCount = activityListWithItems.filter((activity) => {
    const currentMonth = dayjs();
    const startDate = dayjs(activity.ActivityBeginDate);
    const endDate = dayjs(activity.ActivityEndDate);
    return currentMonth.isSame(startDate, 'month') || currentMonth.isSame(endDate, 'month') || (currentMonth.isAfter(startDate) && currentMonth.isBefore(endDate));
  }).length;
  const currentMonthDays = dayjs().daysInMonth();
  const averageActivityPerDay = currentMonthActivityCount / currentMonthDays;

  // 计算今日 Item 总数
  const todayItemCount = activityListWithItems
    .filter((activity) => {
      const today = dayjs();
      const startDate = dayjs(activity.ActivityBeginDate);
      const endDate = dayjs(activity.ActivityEndDate);
      return today.isSame(startDate, 'day') || today.isSame(endDate, 'day') || (today.isAfter(startDate) && today.isBefore(endDate));
    })
    .reduce((total, activity) => {
      const unfinishedItems = activity.items.filter((item) => item.ItemStatus === '未开始' || item.ItemStatus === '进行中');
      return total + unfinishedItems.length;
    }, 0);

  // 计算当月日平均 Item 数
  const currentMonthItemCount = activityListWithItems
    .filter((activity) => {
      const currentMonth = dayjs();
      const startDate = dayjs(activity.ActivityBeginDate);
      const endDate = dayjs(activity.ActivityEndDate);
      return currentMonth.isSame(startDate, 'month') || currentMonth.isSame(endDate, 'month') || (currentMonth.isAfter(startDate) && currentMonth.isBefore(endDate));
    })
    .reduce((total, activity) => {
      return total + activity.items.length;
    }, 0);
  console.log('Current Month Item Count:', currentMonthItemCount);
  const averageItemPerDay = currentMonthItemCount / currentMonthDays;

  const todayItemData = activityListWithItems
    .filter((activity) => {
      const today = dayjs();
      const startDate = dayjs(activity.ActivityBeginDate);
      const endDate = dayjs(activity.ActivityEndDate);
      return today.isSame(startDate, 'day') || today.isSame(endDate, 'day') || (today.isAfter(startDate) && today.isBefore(endDate));
    })
    .reduce((data, activity) => {
      activity.items.forEach((item) => {
        const existingType = data.find((d) => d.type === item.ItemLevel);
        if (existingType) {
          existingType.value += 1;
        } else {
          data.push({ type: item.ItemLevel, value: 1 });
        }
      });
      return data;
    }, [] as { type: string; value: number }[]);

  console.log('Today Item Data:', todayItemData);

  // 饼图配置
  const config = {
    appendPadding: 10,
    data: todayItemData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      // type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [{ type: 'pie-legend-active' }, { type: 'element-active' }],
  };


  return (
    <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 596);
      }}
    >
      <ProCard
        title="日程数据概览"
        extra={Today}
        split={responsive ? 'horizontal' : 'vertical'}
        headerBordered
        bordered
      >
        <ProCard split="horizontal">
          <ProCard split="horizontal">
            <ProCard split="vertical">
              <StatisticCard
                statistic={{
                  title: '今日活动总数',
                  value: todayActivityCount,
                  description: (
                    <Statistic
                      title="较当月日平均数"
                      value={`${((todayActivityCount - averageActivityPerDay) / averageActivityPerDay * 100).toFixed(2)}%`}
                      trend={todayActivityCount >= averageActivityPerDay ? 'up' : 'down'}
                    />
                  ),
                }}
              />
              <StatisticCard
                statistic={{
                  title: '今日事项总数',
                  value: todayItemCount,
                  description: (
                    <Statistic
                      title="较当月日平均数"
                      value={`${((todayItemCount - averageItemPerDay) / averageItemPerDay * 100).toFixed(2)}%`}
                      trend={todayItemCount >= averageItemPerDay ? 'up' : 'down'}
                    />
                  ),
                }}
              />
            </ProCard>
            <ProCard split="vertical">
              <StatisticCard
                statistic={{
                  title: '当月活动总数',
                  value: currentMonthActivityCount,
                  suffix: '个',
                }}
              />
              <StatisticCard
                statistic={{
                  title: '当月事项总数',
                  value: currentMonthItemCount,
                  suffix: '个',
                }}
              />
            </ProCard>
          </ProCard>


          <StatisticCard
            title="流量走势"
            chart={
              <img
                src="https://gw.alipayobjects.com/zos/alicdn/_dZIob2NB/zhuzhuangtu.svg"
                width="100%"
              />
            }
          />
        </ProCard>
        <StatisticCard
          title="今日事项类型分布"
          chart={<Pie {...config} />}
        />
      </ProCard>
    </RcResizeObserver>
  );
};