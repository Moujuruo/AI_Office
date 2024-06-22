// LeftTopSection.tsx
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import * as echarts from 'echarts';
import HttpUtil from '../../utils/HttpUtil';
import ApiUtil from '../../utils/ApiUtil';
import dayjs from 'dayjs';

const LeftTopContainer = styled.div`
  width: 48%;
  height: 300px;
  border: 1px solid #ddd;
  border-radius: 10px;
`;

// const getVirtualData = (year: string) => {
//   const date = +echarts.time.parse(year + '-01-01');
//   const end = +echarts.time.parse(+year + 1 + '-01-01');
//   const dayTime = 3600 * 24 * 1000;
//   const data = [];
//   for (let time = date; time < end; time += dayTime) {
//     data.push([
//       echarts.time.format(time, '{yyyy}-{MM}-{dd}', false),
//       Math.floor(Math.random() * 1000)
//     ]);
//   }
//   return data;
// };

// const option = {
//   tooltip: {
//     position: 'top'
//   },
//   visualMap: [{
//     min: 0,
//     max: 1000,
//     seriesIndex: [0],
//     orient: 'vertical',
//     // right: '10%',
//     left: 'right',
//     bottom: '20%',
//     calculable: true
//   }],
//   calendar: [{
//     orient: 'vertical',
//     yearLabel: {
//       margin: 38,
//       show: false
//     },
//     monthLabel: {
//       margin: 10,
//     },
//     cellSize: 35,
//     left: "center",
//     bottom: 30,
//     range: '2024-06'
//   }],
//   series: [{
//     type: 'effectScatter',
//     coordinateSystem: 'calendar',
//     calendarIndex: 0,
//     symbolSize: function (val: number[]) {
//       return val[1] / 40;
//     },
//     data: getVirtualData('2024')
//   }]
// };

interface ActivityData {
  [key: string]: number;
}

const LeftTopSection: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  const fetchDataAndSetOption = async () => {
    try {
      const data = await HttpUtil.get(ApiUtil.API_Activity_STATISTICS + localStorage.getItem("userID")) as ActivityData;
      const processedData = Object.keys(data).map(date => [date, data[date]]);

      let max = 0;
      for (const key in data) {
        if (data[key] > max) {
          max = data[key];
        }
      }
      
      const option = {
        tooltip: {
          position: 'top'
        },
        visualMap: [{
          min: 0,
          max: Math.ceil((max) / 5) * 5,
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
          range: dayjs().format('YYYY-MM')
        }],
        series: [
          {
            type: 'effectScatter',
            coordinateSystem: 'calendar',
            data: processedData,
          }
        ],
        // Your other option configurations
      };

      if (chartRef.current) {
        const chartInstance = echarts.init(chartRef.current);
        chartInstance.setOption(option);
        return chartInstance;  // 更新：返回chartInstance
      }
    } catch (error) {
      console.error("Failed to fetch activity data:", error);
    }
  };

  useEffect(() => {
    let chartInstance: any;

    const fetchDataAndRenderChart = async () => {
      chartInstance = await fetchDataAndSetOption();
    };

    fetchDataAndRenderChart();

    return () => {
      chartInstance?.dispose();
    };
  }, []);

  return <LeftTopContainer ref={chartRef} />;
};

export default LeftTopSection;


// const LeftTopSection: React.FC = () => {
//   const chartRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (chartRef.current) {
//       const chartInstance = echarts.init(chartRef.current);
//       chartInstance.setOption(option);

//       return () => {
//         chartInstance.dispose();
//       };
//     }
//   }, []);

//   return <LeftTopContainer ref={chartRef} />;
// };

// export default LeftTopSection;
