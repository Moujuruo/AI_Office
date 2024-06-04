import React from 'react';
import { ProChat } from '@ant-design/pro-chat';

const Homepage: React.FC = () => {
    return (
        <div>
            <h2>这是主页</h2>
            <p>这里是另外一个页面的内容。</p>
            <ProChat
                helloMessage={
                '欢迎使用 ProChat ，我是你的专属机器人，这是我们的 Github：[ProChat](https://github.com/ant-design/pro-chat)'
                }
                request={async (messages) => {
                const mockedData: string = `这是一段模拟的对话数据。本次会话传入了${messages.length}条消息`;
                return new Response(mockedData);
                }}
            />
        </div>
    );
};

export default Homepage;