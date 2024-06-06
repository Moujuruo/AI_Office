import React, { useState } from 'react';
import { ProForm, ProFormText } from '@ant-design/pro-components';
import { Button, message, Space } from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import HttpUtil from '../../utils/HttpUtil';
import ApiUtil from '../../utils/ApiUtil';

interface LoginResponse {
  status: number;
  token?: string;
  userID?: string;
  message?: string;
  avatar?: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await HttpUtil.post(ApiUtil.API_LOGIN, values);
      const data = response as LoginResponse;

      if (data.status === 200) {
        message.success('登录成功');
        // localStorage.setItem('token', data.token || ''); // Save token to localStorage
        localStorage.setItem('username', values.username);
        localStorage.setItem('userID', data.userID!);
        if (data.avatar) {
          localStorage.setItem('avatarUrl', data.avatar);
        }
        navigate('/homepage'); // Redirect to homepage
      } else {
        console.log(data);
        message.error('登录失败，请检查用户名和密码');
      }
    } catch (error) {
      message.error('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: 400, padding: 24, border: '1px solid #ddd', borderRadius: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={"./assets/logo.png"} alt="logo" style={{ width: 220, height: 80, marginBottom: -10 }} />
          <h2>全球最大的智能办公平台</h2>
        </div>
        <ProForm onFinish={onFinish} submitter={{
          render: (props, dom) => {
            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>{dom[0]}</div>
                <Space>
                  <Button type="primary" onClick={() => navigate('/register')}>注册</Button>
                  <Button type="primary" htmlType="submit" loading={loading}>登录</Button>
                </Space>
              </div>
            );
          }
        }}>
          <ProFormText
            name="username"
            placeholder="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          />
          <ProFormText.Password
            name="password"
            placeholder="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          />
        </ProForm>
      </div>
    </div>
  );
};

export default Login;
