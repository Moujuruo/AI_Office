import React, { useRef } from 'react';
import { ProChat, ProChatProvider, useProChat } from '@ant-design/pro-chat';
import HttpUtil from '../utils/HttpUtil';
import ApiUtil from '../utils/ApiUtil';
import { XfVoiceDictation } from '@muguilin/xf-voice-dictation';
import styled from 'styled-components';


interface ApiResponse<T> {
    status: number;
    data: T;
}

const ScrollContainer = styled.div`
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  box-sizing: border-box;
  padding: 10px 0;
  display: flex;
  align-items: center;
`;

const ScrollContent = styled.div`
  display: inline-block;
  animation: scroll 10s linear infinite;
  display: flex;

  @keyframes scroll {
    0% { transform: translateX(100%); }
    100% { transform: translateX(-100%); }
  }
`;

const Item = styled.div<{ bgColor: string }>`
  display: inline-block;
  background: ${({ bgColor }) => bgColor};
  padding: 20px;
  margin: 0 10px;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
`;

const items = [
  { id: 1, content: '软件工程学习指南', bgColor: '#FFDD57' },
  { id: 2, content: '错题笔记', bgColor: '#FF6F61' },
  { id: 3, content: '笔记3', bgColor: '#4BCF90' },
  { id: 4, content: 'Article title', bgColor: '#4A90E2' },
  // Add more items if needed
];

const InfiniteScroll = () => (
  <ScrollContainer>
    <ScrollContent>
      {items.map(item => (
        <Item key={item.id} bgColor={item.bgColor}>{item.content}</Item>
      ))}
      {items.map(item => (
        <Item key={`duplicate-${item.id}`} bgColor={item.bgColor}>{item.content}</Item>
      ))}
    </ScrollContent>
  </ScrollContainer>
);


const Homepage: React.FC = () => {
    const chatRef = useRef<any>(null); // 用于获取ProChat实例
    const times = useRef<NodeJS.Timeout | null>(null);

    const handleRequest = async (messages: any) => {
        try {
            const content = messages.map((msg: any) => msg.content).join('\n');
            const response = await HttpUtil.post(ApiUtil.API_AI_CHAT, 
                { 
                    content,
                    userID: localStorage.getItem('userID') 
                }) as ApiResponse<any>;
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log(response.data);
            return new Response(response.data);
        } catch (error) {
            console.error('Error fetching chat response:', error);
            return new Response('Error fetching chat response', { status: 500 });
        }
    };

    // 实例化迅飞语音听写
    const xfVoice = new XfVoiceDictation({
        APPID: '27ce1c02',
        APISecret: 'NWRhNDM1NTJlMmJiYmU0YWI5OGY1YmNm',
        APIKey: 'c55054b06c4f1753117debf4b31168dd',
        onWillStatusChange: function (oldStatus: any, newStatus: any) {
            console.log('开始识别：', oldStatus, newStatus);
        },
        onTextChange: function (text: any) {
            console.log('识别内容：', text);
            if (text) {
                if (times.current) {
                    clearTimeout(times.current);
                }
                times.current = setTimeout(() => xfVoice.stop(), 3000);
                // 将识别内容填充到ProChat的输入框中
                if (chatRef.current) {
                    chatRef.current.setValue(text);
                }
            }
        }
    });

    const handleVoiceButtonClick = () => {
        xfVoice.start();
    };

    const handleVoiceStopButtonClick = () => {
        xfVoice.stop();
    };

    
      return (
        <div>
          <InfiniteScroll />
          <div
            style={{
              background: "#ffffff",
              borderRadius: 10,
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              marginTop: 20,
            }}
          >
            <div style={{ height: "400px" }}>
              <ProChat
                helloMessage={"欢迎使用协时通，我是你的智能AI助手！"}
                request={handleRequest}
              />
            </div>
          </div>
        </div>
      );
};

export default Homepage;
