import { ProCard, StatisticCard } from '@ant-design/pro-components';
import RcResizeObserver from 'rc-resize-observer';
import React, { useEffect } from 'react';
import { useState } from 'react';
import dayjs from 'dayjs';
import { TodoItem, TodoActivity } from '../TodoList/TodoList';
import HttpUtil from '../../utils/HttpUtil';
import ApiUtil from '../../utils/ApiUtil';
import { Button, Tooltip, message } from 'antd';
import { Pie } from '@ant-design/plots';
import { Bar, Line } from '@ant-design/charts';
import { QuestionCircleOutlined } from '@ant-design/icons';

const { Statistic } = StatisticCard;



export default () => {
  const [responsive, setResponsive] = useState(false);
  const [activityListWithItems, setActivityListWithItems] = useState<TodoActivity[]>([]);
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
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
          existingType.counts += 1;
        } else {
          data.push({ type: item.ItemLevel, counts: 1 });
        }
      });
      return data;
    }, [] as { type: string; counts: number }[]);

  console.log('Today Item Data:', todayItemData);

  // 饼图配置
  const config = {
    data: todayItemData,
    height: 200,

    angleField: 'counts',
    colorField: 'type',
    // paddingRight: 80,
    innerRadius: 0.6,
    label: {
      text: (d: any) => `${d.counts}`,
      style: {
        fontWeight: 'bold',
      },
    },
    legend: {
      color: {
        title: false,
        position: 'right',
        rowPadding: 5,
      },
    },
  };

  const getUrgencyScore = (item: TodoItem, activityEndDate: string) => {
    const itemLevelScore = item.ItemLevel === '重要且紧急' ? 4 :
      item.ItemLevel === '紧急但不重要' ? 3 :
        item.ItemLevel === '重要但不紧急' ? 2 : 1;

    const daysUntilEnd = dayjs(activityEndDate).diff(dayjs(), 'day');
    const urgencyScore = 100 - (daysUntilEnd * 5 + (5 - itemLevelScore) * 5);

    return Math.min(Math.max(urgencyScore, 5), 95);
  };

  type TopItem = TodoItem & { urgencyScore: number };

  const todayTopItems = activityListWithItems
    .filter(activity => {
      const today = dayjs();
      const endDate = dayjs(activity.ActivityEndDate);
      return today.isSame(endDate, 'day') || today.isBefore(endDate);
    })
    .flatMap(activity =>
      activity.items
        .filter(item => item.ItemStatus !== '已完成')
        .map(item => ({ ...item, urgencyScore: getUrgencyScore(item, activity.ActivityEndDate) }))
    )
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
    .slice(0, 4) as TopItem[];

  console.log('Today Top Items:', todayTopItems);

  // 柱状图配置
  const barConfig = {
    data: todayTopItems,
    xField: 'ItemContent',
    yField: 'urgencyScore',
    paddingRight: 80,
    height: 190,
    // autoFit: true,
    // barWidthRatio: 0.5,
    style: {
      maxWidth: 25,
    },
    markBackground: {
      label: {
        text: (item: any) => {
          const urgencyScore = item.originData ? item.originData.urgencyScore : item.urgencyScore;
          return `${urgencyScore}`;
        },
        position: 'right',
        dx: 40,
        style: {
          fill: '#aaa',
          fillOpacity: 1,
          fontSize: 14,
        },
      },
      style: {
        fill: '#eee',
      },
    },
    scale: {
      y: {
        domain: [0, 100],
      },
    },
    axis: {
      x: {
        tick: false,
        title: false,
      },
      y: {
        grid: false,
        tick: false,
        label: false,
        title: false,
      },
    },
    interaction: {
      elementHighlightByColor: false,
    },

  };

  const today = dayjs();
  const last9Days = [];
  for (let i = 8; i >= 0; i--) {
    last9Days.push(today.subtract(i, 'day'));
  }

  const itemStatusData = last9Days.flatMap(day => [
    {
      date: day.format('MM-DD'),
      type: '进行中的事项',
      value: activityListWithItems.flatMap(activity =>
        activity.items.filter(item =>
          item.ItemStatus === '进行中' &&
          dayjs(item.ongoing_time).isSame(day, 'day')
        )
      ).length,
    },
    {
      date: day.format('MM-DD'),
      type: '已完成的事项',
      value: activityListWithItems.flatMap(activity =>
        activity.items.filter(item =>
          item.ItemStatus === '已完成' &&
          dayjs(item.finish_time).isSame(day, 'day')
        )
      ).length,
    },
  ]);

  console.log('Item Status Data:', itemStatusData);

  const lineConfig = {
    data: itemStatusData,
    xField: 'date',
    yField: 'value',
    colorField: 'type',
    height: 260,
    legend: {
      position: 'top',
    },
    tooltip: {
      title: 'date',
      items: ['value'],
    },
    point: {
      size: 5,
      shape: 'diamond',
    },
  };


  const handleClick = () => {
    // 跳转到/staff-list
    window.location.href = '/staff-list';
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
        extra={
          <>
            {Today}
            <Button type="primary" onClick={handleClick} style={{ marginLeft: 16 }}>
              查看详细信息
            </Button>
          </>
        }
        split={responsive ? 'horizontal' : 'vertical'}
        headerBordered
        bordered
      >
        <ProCard split="horizontal">
          <ProCard split="horizontal">
            <ProCard split="vertical" >
              <StatisticCard
                loading={loading}
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
                loading={loading}
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
                loading={loading}
                statistic={{
                  title: '当月活动总数',
                  value: currentMonthActivityCount,
                  suffix: '个',
                }}
              />
              <StatisticCard

                loading={loading}
                statistic={{
                  title: '当月事项总数',
                  value: currentMonthItemCount,
                  suffix: '个',
                }}
              />
            </ProCard>
          </ProCard>


          <StatisticCard
            title="近9日事项进度"
            chart={<Line {...lineConfig} />}
          />
        </ProCard>
        <ProCard split="horizontal" >
          <StatisticCard
            // title="流量占用情况"
            title="今日事项类型分布"
            chart={<Pie {...config} />}
          />
          <StatisticCard
            title={
              <>
                今日最要紧事项
                <Tooltip
                  title={
                    <>
                      要紧值计算方式:
                      <br />
                      1. 只考虑未开始与进行中的事项
                      <br />
                      2. 离对应活动结束时间越近的事项越要紧
                      <br />
                      3. 重要且紧急的事项最要紧,其次是紧急但不重要的事项,再次是重要但不紧急的事项,最后是不重要且不紧急的事项
                      <br />
                      4. 要紧值范围在 5-95 之间
                    </>
                  }
                >
                  <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                </Tooltip>
              </>
            }
            chart={<Bar {...barConfig} />}
          />
        </ProCard>
      </ProCard>
    </RcResizeObserver>
  );
};