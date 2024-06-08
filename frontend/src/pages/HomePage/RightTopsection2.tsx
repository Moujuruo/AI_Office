// RightTopSection.tsx
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import * as echarts from 'echarts';

const RightTopContainer = styled.div`
  width: 48%;
  height: 300px;
  border: 1px solid #ddd;
  border-radius: 10px;
`;

const data = [
  {
    name: 'Crucial',
    children: [
      { name: '软工实践', value: 10 },
      { name: '嘉阳好强', value: 20 },
      { name: '小王好强', value: 30 },
    ],
  },
  {
    name: 'Important',
    children: [
      { name: 'test', value: 15 },
      { name: '课堂笔记', value: 25 },
      { name: 'test2', value: 35 },
    ],
  },
  {
    name: 'Common',
    children: [
      { name: 'Note 7', value: 8 },
      { name: 'Note 8', value: 18 },
      { name: 'Note 9', value: 28 },
    ],
  },
];

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

const option = {
  title: {
    text: 'Notes Categorization',
    left: 'center'
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
        'Value: ' + formatUtil.addCommas(value)
      ].join('');
    }
  },
  series: [
    {
      name: 'Notes Categorization',
      type: 'treemap',
      visibleMin: 300,
      label: {
        show: true,
        formatter: '{b}'
      },
      itemStyle: {
        borderColor: '#fff'
      },
      levels: getLevelOption(),
      data: data
    }
  ]
};

const RightTopSection2: React.FC = () => {
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

  return <RightTopContainer ref={chartRef} />;
};

export default RightTopSection2;
