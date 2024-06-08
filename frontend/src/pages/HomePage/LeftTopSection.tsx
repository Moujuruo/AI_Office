// LeftTopSection.tsx
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import * as echarts from 'echarts';

const LeftTopContainer = styled.div`
  width: 48%;
  height: 300px;
  border: 1px solid #ddd;
  border-radius: 10px;
`;

const getVirtualData = (year: string) => {
  const date = +echarts.time.parse(year + '-01-01');
  const end = +echarts.time.parse(+year + 1 + '-01-01');
  const dayTime = 3600 * 24 * 1000;
  const data = [];
  for (let time = date; time < end; time += dayTime) {
    data.push([
      echarts.time.format(time, '{yyyy}-{MM}-{dd}', false),
      Math.floor(Math.random() * 1000)
    ]);
  }
  return data;
};

const option = {
  tooltip: {
    position: 'top'
  },
  visualMap: [{
    min: 0,
    max: 1000,
    seriesIndex: [0],
    orient: 'vertical',
    // right: '10%',
    left: 'right',
    bottom: '20%',
    calculable: true
  }],
  calendar: [{
    orient: 'vertical',
    yearLabel: {
      margin: 38,
      show: false
    },
    monthLabel: {
      margin: 10,
    },
    cellSize: 35,
    left: "center",
    bottom: 30,
    range: '2024-06'
  }],
  series: [{
    type: 'effectScatter',
    coordinateSystem: 'calendar',
    calendarIndex: 0,
    symbolSize: function (val: number[]) {
      return val[1] / 40;
    },
    data: getVirtualData('2024')
  }]
};

const LeftTopSection: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const chartInstance = echarts.init(chartRef.current);
      chartInstance.setOption(option);

      return () => {
        chartInstance.dispose();
      };
    }
  }, []);

  return <LeftTopContainer ref={chartRef} />;
};

export default LeftTopSection;
