// RightTopSection.tsx
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as echarts from 'echarts';
import ApiUtil from '../../utils/ApiUtil';
import { Html5TwoTone } from '@ant-design/icons';
import HttpUtil from '../../utils/HttpUtil';

const RightTopContainer = styled.div`
  width: 48%;
  height: 300px;
  border: 1px solid #ddd;
  border-radius: 10px;
`;

const formatUtil = echarts.format;

function getLevelOption() {
  return [
    {
      itemStyle: {
        borderWidth: 0,
        gapWidth: 5
      }
    },
    {
      itemStyle: {
        gapWidth: 1
      }
    },
    {
      colorSaturation: [0.35, 0.5],
      itemStyle: {
        gapWidth: 1,
        borderColorSaturation: 0.6
      }
    }
  ];
}

const RightTopSection2: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<{
    name: string;
    children: { name: string; value: number }[];
  }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await HttpUtil.get(ApiUtil.API_NOTE_LIST + localStorage.getItem('username')) as {
          status: number;
          titles: string[];
          importances: string[];
        };
        console.log(result);
        // const result = await response.json();
        if (result.status === 200) {
          const { titles, importances } = result;
          const formattedData = [
            {
              name: 'Crucial',
              children: titles
                .map((title: any, index: any) => ({
                  name: title,
                  value: importances[index] === 'Crucial' ? 1 : 0,
                }))
                .filter((item: any) => item.value === 1),
            },
            {
              name: 'Important',
              children: titles
                .map((title: any, index: any) => ({
                  name: title,
                  value: importances[index] === 'Important' ? 1 : 0,
                }))
                .filter((item: any) => item.value === 1),
            },
            {
              name: 'Normal',
              children: titles
                .map((title: any, index: any) => ({
                  name: title,
                  value: importances[index] === 'Normal' ? 1 : 0,
                }))
                .filter((item: any) => item.value === 1),
            },
          ];
          setData(formattedData);
        }
      } catch (error) {
        console.error('Error fetching note list:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      const chartInstance = echarts.init(chartRef.current);
      const option = {
        title: {
          text: 'Notes Categorization',
          left: 'center',
        },
        tooltip: {
          formatter: function (info: any) {
            const value = info.value;
            const treePathInfo = info.treePathInfo;
            const treePath = [];

            for (let i = 1; i < treePathInfo.length; i++) {
              treePath.push(treePathInfo[i].name);
            }

            return [
              '<div class="tooltip-title">' +
                formatUtil.encodeHTML(treePath.join('/')) +
                '</div>',
              'Value: ' + formatUtil.addCommas(value),
            ].join('');
          },
        },
        series: [
          {
            name: 'Notes Categorization',
            type: 'treemap',
            visibleMin: 300,
            label: {
              show: true,
              formatter: '{b}',
            },
            itemStyle: {
              borderColor: '#fff',
            },
            levels: getLevelOption(),
            data: data,
          },
        ],
      };
      chartInstance.setOption(option);

      return () => {
        chartInstance.dispose();
      };
    }
  }, [data]);

  return <RightTopContainer ref={chartRef} />;
};

export default RightTopSection2;
