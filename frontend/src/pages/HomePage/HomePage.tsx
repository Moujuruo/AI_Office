import React, { useRef, useState } from 'react';
import { ProChat, ProChatProvider, useProChat } from '@ant-design/pro-chat';
import HttpUtil from '../../utils/HttpUtil';
import ApiUtil from '../../utils/ApiUtil';
import { ApiResponse } from '../../utils/ApiUtil';
import { XfVoiceDictation } from '@muguilin/xf-voice-dictation';
import styled from 'styled-components';
import RightTopSection from './RightTopSection';
import LeftTopSection from './LeftTopSection';
import RightTopSection2 from './RightTopsection2';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const TopArea = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 1000px;
  margin-bottom: 20px;
  position: relative;
`;

const Placeholder = styled.div`
  width: 48%;
  height: 300px;
  border: 1px solid #ddd;
  border-radius: 10px;
`;


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
      <Container>
        <TopArea>
          <LeftTopSection />
          <RightTopSection2 /> {/* Use the new component */}
        </TopArea>
        <div
          style={{
            background: "#ffffff",
            borderRadius: 10,
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
            width: '100%',
            maxWidth: '1000px',
          }}
        >
          <div style={{ height: "350px" }}>
            <ProChat
              helloMessage={"欢迎使用协时通，我是你的智能AI助手！"}
              request={handleRequest}
            />
          </div>
        </div>
      </Container>
    );
};

export default Homepage;
