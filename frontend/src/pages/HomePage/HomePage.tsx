import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { ChatItemProps, ProChat, ProChatProvider, useProChat } from '@ant-design/pro-chat';
import HttpUtil from '../../utils/HttpUtil';
import ApiUtil from '../../utils/ApiUtil';
import { ApiResponse } from '../../utils/ApiUtil';
import { XfVoiceDictation } from '@muguilin/xf-voice-dictation';
import styled from 'styled-components';
import RightTopSection from './RightTopSection';
import LeftTopSection from './LeftTopSection';
import RightTopSection2 from './RightTopsection2';
import { Button, Card, Flex, Form, Input, InputNumber, Modal, Select, message } from 'antd';
import moment from 'moment';

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


interface Member {
  member_id: number;
  is_captain: number;
}

interface Team {
  team_id: number;
  team_name: string;
  is_captain: number;
  members: Member[];
}

interface FormData {
  subject: string;
  date: string;
  time: string;
  number_of_people: number;
  room_name: string;
  room_id: number;
  team_id?: number;
}

interface FormComponentProps {
  formData: FormData;
}

const Homepage: React.FC = () => {
  const chatRef = useRef<any>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  const handleSubmit = async (values: any) => {
    try {
      const [startTime, endTime] = values.time.split('-');
      const newReservation = {
        room_id: values.room_id,
        user_id: localStorage.getItem('userID') || 1,
        start_time: startTime,
        end_time: endTime,
        date: values.date,
        subject: values.subject,
        type: values.type,
        team_id: values.type === 'team' ? values.team_id : null,
      };
      const response = await HttpUtil.post(ApiUtil.API_INSERT_RESERVATION, newReservation) as ApiResponse<any>;
      if (response.status === 200) {
        message.success('预约成功');
      } else {
        message.error('预约失败');
      }
    } catch (error) {
      message.error('预约失败');
    }
  };

  const FormComponent: React.FC<FormComponentProps> = ({ formData }) => {
    const [type, setType] = useState('individual');
    const [form] = Form.useForm();

    useEffect(() => {
      fetchTeams();
    }, []);

    const handleTypeChange = (value: string) => {
      setType(value);
      if (value === 'individual') {
        form.setFieldsValue({ team_id: undefined });
      }
    };

    return (
      <Card>
        <Form form={form} layout="vertical" initialValues={formData} onFinish={handleSubmit}>
          <Form.Item label="标题" name="subject">
            <Input />
          </Form.Item>
          <Form.Item label="日期" name="date">
            <Input />
          </Form.Item>
          <Form.Item label="时间" name="time">
            <Input />
          </Form.Item>
          <Form.Item label="类型" name="type">
            <Select onChange={handleTypeChange} defaultValue={'individual'}>
              <Select.Option value="individual">个人</Select.Option>
              <Select.Option value="team">团队</Select.Option>
            </Select>
          </Form.Item>
          {type === 'individual' ? (
            <Form.Item label="人数" name="number_of_people">
              <Input disabled />
            </Form.Item>
          ) : (
            <Form.Item label="团队" name="team_id">
              <Select>
                {teams.map((team) => (
                  <Select.Option key={team.team_id} value={team.team_id}>
                    {team.team_name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item label="会议室" name="room_name">
            <Input />
          </Form.Item>
          <Form.Item name="room_id" hidden>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              提交预约
            </Button>
          </Form.Item>
        </Form>
      </Card>
    );
  };

  const fetchTeams = async () => {
    try {
      const response = await HttpUtil.post(ApiUtil.API_GET_ALL_TEAMS,
        {
          userID: localStorage.getItem('userID')
        }
      ) as ApiResponse<Team[]>;
      if (response.status === 200) {
        const userID = localStorage.getItem('userID');
        const filteredTeams = response.data.filter((team) => {
          console.log(team);
          return team.is_captain === 1;
        });
        setTeams(filteredTeams);
        console.log(filteredTeams);
        console.log('teams:', teams);
      } else {
        message.error('获取团队列表失败');
      }
    } catch (error) {
      message.error('获取团队列表失败');
    }
  };

  const handleRequest = async (messages: any) => {
    try {
      const content = messages.map((msg: any) => msg.content).join('\n');
      const response = await HttpUtil.post(ApiUtil.API_AI_CHAT, {
        content,
        userID: localStorage.getItem('userID'),
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
  const Control = () => {
    const [isRecording, setIsRecording] = useState(false);
    const proChat = useProChat();
    const chatRef = useRef('');
  
    const xfVoice = new XfVoiceDictation({
      APPID: '27ce1c02',
      APISecret: 'NWRhNDM1NTJlMmJiYmU0YWI5OGY1YmNm',
      APIKey: 'c55054b06c4f1753117debf4b31168dd',
      onWillStatusChange: function (oldStatus: any, newStatus: any) {
        console.log('语音识别状态变化:', oldStatus, newStatus);
        if (newStatus === 'end') {
          // 获取识别的文本并发送消息
          const recognizedText = chatRef.current;
          if (recognizedText) {
            proChat.sendMessage(recognizedText);
            chatRef.current = ''
            
          }
        }
      },
      onTextChange: function (text: any) {
        console.log('识别内容:', text);
        if (text) {
          chatRef.current = text;  // 保存识别到的内容
        }
      }
    });
  
    const handleVoiceButtonClick = () => {
      if (isRecording) {
        xfVoice.stop();
        setIsRecording(false);
      } else {
        chatRef.current = ''
        xfVoice.start();
        setIsRecording(true);
      }
    };
  
    return (
      <div style={{ paddingBottom: 8, paddingLeft: 24, textAlign: 'right' }}>
        <Button
          type={'primary'}
          onClick={handleVoiceButtonClick}
        >
          {isRecording ? '停止录音' : '开始录音'}
        </Button>
      </div>
    );
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
        <div style={{ height: '350px' }}>
          <ProChatProvider>
          <Control />
          <ProChat
            helloMessage={'欢迎使用协时通，我是你的智能AI助手！\n我可以帮助你查询日程、安排会议。\n你可以试着问我：\n1. 我今天有哪些安排 \n2. 今天我有哪些会议 \n3. 请帮我预约一个明天下午6人的会议室'}
            request={handleRequest}
            chatItemRenderConfig={{
              contentRender: (props: ChatItemProps<Record<string, any>>, defaultDom: ReactNode) => {
                const item = props.originData;
                console.log('====', item);

                if (typeof item?.content === 'string' && (item.content.startsWith('```json') || item.content.startsWith('{'))) {
                  try {
                    const jsonString = item.content.replace(/```json|\n```/g, '').trim();
                    const formData = JSON.parse(jsonString);
                    console.log('formData:', formData);

                    return <FormComponent formData={formData} />;
                  } catch (error) {
                    console.error('Error parsing JSON:', error);
                    return defaultDom;
                  }
                }
                return defaultDom;
              },
            }}
          />
          </ProChatProvider>
        </div>
      </div>
    </Container>
  );
};

export default Homepage;
