import React from 'react';
import { ProChat } from '@ant-design/pro-chat';
import HttpUtil from '../utils/HttpUtil';
import ApiUtil from '../utils/ApiUtil';

interface ApiResponse<T> {
    status: number;
    data: T;
}

const Homepage: React.FC = () => {
    const handleRequest = async (messages: any) => {
        try {
            // 这里假设 messages 是一个数组，提取其内容发送到后端
            const content = messages.map((msg: any) => msg.content).join('\n');
            
            const response = await HttpUtil.post(ApiUtil.API_AI_CHAT, { content }) as ApiResponse<any>;
            
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log(response.data);
            // return new Response('测试换行\n\n1234567');
            return new Response(response.data);
        } catch (error) {
            console.error('Error fetching chat response:', error);
            return new Response('Error fetching chat response', { status: 500 });
        }
    };
    return (
        <div>
            <h2>协时通：智能办公平台</h2>
            <div style={{ height: '500px' }}>
                <ProChat
                    // displayMode={'docs'}
                    helloMessage={
                    '欢迎使用协时通，我是你的智能AI助手！'
                    }
                    request={handleRequest}
                    
                />
            </div>
        </div>
    );
};

export default Homepage;