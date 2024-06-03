import React from 'react';
import { ProLayout } from '@ant-design/pro-components';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Layout, Button, Dropdown, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { UserOutlined, DownOutlined, SmileOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;

const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const username = localStorage.getItem('username');

    const logout = () => {
        // localStorage.removeItem('token');
        localStorage.removeItem('userID');
        localStorage.removeItem('username');

        navigate('/login');
    };

    // const menu = (
    //     <Menu>
    //         <Menu.Item key="logout" onClick={logout}>
    //             退出登录
    //         </Menu.Item>
    //     </Menu>
    // );

    const items: MenuProps['items'] = [
        {
            key: 'logout',
            onClick: logout,
            // children: '退出登录',
            label: (
                <a >退出登录</a>
            ),
            icon: <SmileOutlined />
        },
    ]

    return (
        <ProLayout
            title="智能办公管理系统"
            logo={<div className="logo" />}
            layout="mix"
            navTheme="light"
            headerRender={() => (
                <Header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <UserOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
                        <span>你好, {username}</span>
                        <Dropdown menu={{items}} trigger={['click']} >
                            <a onClick={e => e.preventDefault()} style={{ marginLeft: '8px' }}>
                                <DownOutlined />
                            </a>
                        </Dropdown>
                    </div>
                </Header>
            )}
            menuItemRender={(item, dom) => <Link to={item.path || '/'}>{dom}</Link>}
            menuDataRender={() => [
                { path: '/', name: '首页', default: true },
                { path: '/staff-list', name: '日程表' },
                { path: '/notelist-page', name: '笔记备忘录' },
                { path: '/reservation-page', name: '会议室预定' },
            ]}
        >
            <Content style={{ padding: '0 24px 24px' }}>
                <Outlet />
            </Content>
        </ProLayout>
    );
};

export default MainLayout;
