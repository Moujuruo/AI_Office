import React from 'react';
import { ProLayout } from '@ant-design/pro-components';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Layout, Button } from 'antd';

const { Header, Content } = Layout;

const MainLayout: React.FC = () => {
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <ProLayout
            title="智能办公管理系统"
            logo={<div className="logo" />}
            layout="mix"
            navTheme="light"
            headerRender={() => (
                <Header className="header">
                    <Button onClick={logout} style={{ position: "absolute", left: "70px", top: "20px" }}>Logout</Button>
                    {/* <h1 style={{ color: "lightblue", textAlign: "center" }}>智能办公管理系统</h1> */}
                </Header>
            )}
            menuItemRender={(item, dom) => <Link to={item.path || '/'}>{dom}</Link>}
            menuDataRender={() => [
                { path: '/', name: '首页', default: true },
                { path: '/staff-list', name: '日程表' },
                { path: '/another-page', name: '其他页面' },
            ]}
        >
            <Content style={{ padding: '0 24px 24px' }}>
                <Outlet />
            </Content>
        </ProLayout>
    );
};

export default MainLayout;
