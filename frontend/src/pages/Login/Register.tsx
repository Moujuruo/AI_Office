import React, { useState } from 'react';
import { ProForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { Button, message, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import HttpUtil from '../../utils/HttpUtil';
import ApiUtil from '../../utils/ApiUtil';

interface RegisterResponse {
  status: number;
  message?: string;
}

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    console.log('Received values of form: ', values);
    setLoading(true);
    try {
      const response = await HttpUtil.post(ApiUtil.API_REGISTER, values);
      const data = response as RegisterResponse;

      if (data.status === 200) {
        message.success('注册成功');
        navigate('/login'); // Redirect to login page
      } else {
        message.error(data.message || '注册失败，请重试');
      }
    } catch (error) {
      message.error('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: 400, padding: 24, border: '1px solid #ddd', borderRadius: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1>注册</h1>
        </div>
        <ProForm onFinish={onFinish} submitter={{
          render: (props, dom) => {
            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>{dom[0]}</div>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>注册</Button>
                  <Button type="primary" onClick={() => navigate('/login')}>登录</Button>
                </Space>
              </div>
            );
          }
        }}>
          <ProFormText
            name="username"
            placeholder="用户名"
            // rules={[{ required: true, message: '请输入用户名' }]}
            // 英文、数字、下划线，长度4-16
            rules={[{ required: true, pattern: /^[a-zA-Z0-9_]{4,16}$/, message: '用户名只能包含英文、数字、下划线，长度在4-16' }]}
        
          />
          <ProFormSelect
            name="gender"
            placeholder="性别"
            options={[
              { label: '男', value: 'male' },
              { label: '女', value: 'female' },
            ]}
            rules={[{ required: true, message: '请选择性别' }]}
          />
          <ProFormText.Password
            name="password"
            placeholder="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          />
          <ProFormText.Password
            name="confirmPassword"
            placeholder="确认密码"
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          />
        </ProForm>
      </div>
    </div>
  );
};

export default Register;
