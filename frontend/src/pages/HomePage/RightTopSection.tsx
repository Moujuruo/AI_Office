import React, { useRef, useState } from 'react';
import { ProChat, ProChatProvider, useProChat } from '@ant-design/pro-chat';
import HttpUtil from '../../utils/HttpUtil';
import ApiUtil from '../../utils/ApiUtil';
import { ApiResponse } from '../../utils/ApiUtil';
import styled from 'styled-components';

const ContentArea = styled.div`
  width: 48%;
  display: flex;
  height: 300px;
  flex-direction: column;
  align-items: center;
  position: relative;
  border: 1px solid #ddd;
  border-radius: 10px;
  overflow: hidden;
`;

const ToggleButton = styled.div`
  display: flex;
  margin-bottom: 10px;
`;

const Button = styled.button<{ active: boolean }>`
  padding: 10px 20px;
  margin: 0 5px;
  background-color: ${({ active }) => (active ? '#ddd' : '#f5f5f5')};
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
`;

const ItemsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 95%;
`;

const Item = styled.div<{ bgColor: string }>`
  background: ${({ bgColor }) => bgColor};
  width: 38%;
  margin: 10px 6%;
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  height: 90px;
`;

const ArrowButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.1);
  border: none;
  padding: 10px;
  cursor: pointer;
  border-radius: 50%;
  z-index: 1;
`;

const LeftArrowButton = styled(ArrowButton)`
  left: 2px;
`;

const RightArrowButton = styled(ArrowButton)`
  right: 2px;
`;

const items = [
  { id: 1, content: '软件工程学习指南', bgColor: '#FFDD57' },
  { id: 2, content: '错题笔记', bgColor: '#FF6F61' },
  { id: 3, content: '笔记3', bgColor: '#4BCF90' },
  { id: 4, content: 'Article title', bgColor: '#4A90E2' },
  { id: 5, content: '项目总结', bgColor: '#FFDD57' },
  { id: 6, content: '团队协作', bgColor: '#FF6F61' },
  { id: 7, content: '技术文档', bgColor: '#4BCF90' },
  { id: 8, content: '开发计划', bgColor: '#4A90E2' },
];

const RightTopSection: React.FC = () => {
    const [view, setView] = useState('personal');
    const [pageIndex, setPageIndex] = useState(0);
  
    const itemsPerPage = 4;
    const totalPages = Math.ceil(items.length / itemsPerPage);
  
    const handleLeftClick = () => {
      setPageIndex((pageIndex - 1 + totalPages) % totalPages);
    };
  
    const handleRightClick = () => {
      setPageIndex((pageIndex + 1) % totalPages);
    };
  
    const displayedItems = items.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage);
  
    return (
      <ContentArea>
        <ToggleButton>
          <Button active={view === 'personal'} onClick={() => setView('personal')}>
            个人
          </Button>
          <Button active={view === 'team'} onClick={() => setView('team')}>
            团队
          </Button>
        </ToggleButton>
        <ItemsContainer>
          {displayedItems.map((item, index) => (
            <Item key={item.id} bgColor={item.bgColor} style={{ marginTop: index % 2 === 0 ? '0' : '20px' }}>
              {item.content}
            </Item>
          ))}
        </ItemsContainer>
        <LeftArrowButton onClick={handleLeftClick}>{'<'}</LeftArrowButton>
        <RightArrowButton onClick={handleRightClick}>{'>'}</RightArrowButton>
      </ContentArea>
    );
  };
  
  export default RightTopSection;