import React, { useEffect, useState } from 'react';
import { MenuDataItem, ProLayout } from '@ant-design/pro-components';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Layout, Button, Dropdown, Menu, message, Upload, notification, Badge } from 'antd';
import type { MenuProps } from 'antd';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import { UserOutlined, DownOutlined, SmileOutlined, UploadOutlined, BellOutlined, HomeOutlined, AreaChartOutlined, CalendarOutlined, FileTextOutlined, TeamOutlined, ContainerOutlined } from '@ant-design/icons';
import ApiUtil from '../utils/ApiUtil';
import HttpUtil from '../utils/HttpUtil';
import { ApiResponse } from '../utils/ApiUtil';

const { Header, Content } = Layout;

interface inviteinfo {
    captain_id: number,
    team_id: number,
    user_id: number
}

interface reservationinfo {
    id: number,
    room_id: number,
    room_name: string,
    reserve_user_id: number,
    reserve_user_name: string,
    team_id: number,
    team_name: string,
    date: string,
    start_time: string,
    end_time: string,
    type: number,
}


const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const userID = localStorage.getItem('userID');
    const [status, setStatus] = useState<number | null>(1);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [api, contextHolder] = notification.useNotification();
    // let invitations: inviteinfo[] = [];
    const [invitations, setInvitations] = useState<inviteinfo[]>([]);
    const [reservations, setReservations] = useState<reservationinfo[]>([]);

    useEffect(() => {
        const avatar = localStorage.getItem('avatarUrl');
        if (avatar) {
            setAvatarUrl(avatar.replace("\\", "/"));
        }
    }, []);

    useEffect(() => {
        checkInvitations();
        checkMeetings();
    }, []);

    const logout = () => {
        localStorage.removeItem('userID');
        localStorage.removeItem('username');
        localStorage.removeItem('avatarUrl');
        navigate('/login');
    };

    const checkInvitations = async () => {
        try {
            const response = await HttpUtil.post(ApiUtil.API_GET_BE_INVITED_TEAMS, { userID: userID }) as ApiResponse<inviteinfo[]>;
            console.log('response:', response);
            if (response.status === 200) {
                console.log('invitations1:', invitations);

                const newinvitations = response.data;
                setInvitations(newinvitations);


                if (newinvitations.length > 0) {
                    console.log('invitations:', newinvitations);
                    newinvitations.forEach((invitation: any) => {
                        const { team_id, captain_id } = invitation;
                        const key = `invitation-${team_id}`;

                        api.open({
                            message: '团队邀请',
                            description: `你被邀请加入团队 ${team_id}`,
                            btn: (
                                <div>
                                    <Button type='primary' onClick={() => acceptInvitation(team_id, captain_id, key)}>接受</Button>
                                    <Button onClick={() => rejectInvitation(team_id, captain_id, key)} style={{ marginLeft: '8px' }}>拒绝</Button>
                                </div>
                            ),
                            key,
                            duration: 10,
                            showProgress: true,
                            onClose: () => api.destroy(key),
                        });
                    });
                }
            }
        } catch (error) {
            console.error('获取团队邀请失败:', error);
        }
    };

    // 类似的，展示会议室预定通知，按钮变为已读和忽略，根据type区别，0为通知有会议，1为会议预定取消
    const checkMeetings = async () => {
        try {
            const response = await HttpUtil.post(ApiUtil.API_GET_RESERVATION_INFO, { userID: userID }) as ApiResponse<reservationinfo[]>;
            console.log('response:', response);
            if (response.status === 200) {
                console.log('reservations1:', reservations);

                const newreservations = response.data;
                setReservations(newreservations);

                if (newreservations.length > 0) {
                    console.log('reservations:', newreservations);
                    newreservations.forEach((reservation: any) => {
                        const { id, room_id, room_name, reserve_user_id, reserve_user_name, team_id, team_name, date, start_time, end_time, type } = reservation;
                        const key = `reservation-${id}`;
                        if (type === 0)
                            api.open({
                                message: '会议室预定通知',
                                description: `团队 ${team_name} 于 ${date} ${start_time} - ${end_time} 在 ${room_name} 预定了会议, 请注意查看`,
                                btn: (
                                    <div>
                                        <Button type='primary' onClick={() => acceptMeeting(id, type, key)}>已读</Button>
                                        <Button onClick={() => {
                                            api.destroy(key);
                                        }} style={{ marginLeft: '8px' }}>忽略</Button>
                                    </div>
                                ),
                                key,
                                duration: 10,
                                showProgress: true,
                                onClose: () => api.destroy(key),
                            });
                        else
                            api.open({
                                message: '会议室预定通知',
                                description: `团队 ${team_name} 于 ${date} ${start_time} - ${end_time} 在 ${room_name} 取消了会议, 请注意查看`,
                                btn: (
                                    <div>
                                        <Button type='primary' onClick={() => acceptMeeting(id, type, key)}>已读</Button>
                                        <Button onClick={() => {
                                            api.destroy(key);
                                        }} style={{ marginLeft: '8px' }}>忽略</Button>
                                    </div>
                                ),
                                key,
                                duration: 10,
                                showProgress: true,
                                onClose: () => api.destroy(key),
                            });
                    });
                }
            } else
                console.log('获取会议室预定通知失败');
        } catch (error) {
            console.error('获取会议室预定通知失败:', error);
        }
    }

    const acceptMeeting = async (reservation_id: number, type: number, notificationKey: string) => {
        try {
            const response = await HttpUtil.post(ApiUtil.API_ACCEPT_RESERVATION, { reservation_id: reservation_id, userID: userID, type: type}) as ApiResponse<string>;
            if (response.status === 200) {
                api.success({
                    message: '已读成功',
                    description: '已成功标记为已读',
                });
                if (notificationKey !== '')
                    api.destroy(notificationKey);  // Destroy the notification
                setReservations(reservations.filter(reservation => reservation.id !== reservation_id));
            } else {
                api.error({
                    message: '已读失败',
                    description: response.data,
                });
            }
        } catch (error) {
            console.error('已读失败:', error);
            api.error({
                message: '已读失败',
                description: '发生未知错误',
            });
        }
    };

    

    const acceptInvitation = async (teamId: number, captainId: number, notificationKey: string) => {
        try {
            const response = await HttpUtil.post(ApiUtil.API_ACCEPT_INVITATION, { userID: userID, teamID: teamId }) as ApiResponse<string>;
            if (response.status === 200) {
                api.success({
                    message: '接受邀请成功',
                    description: '你已成功加入团队',
                });
                if (notificationKey !== '')
                    api.destroy(notificationKey);  // Destroy the notification
                setInvitations(invitations.filter(invitation => invitation.team_id !== teamId));
            } else {
                api.error({
                    message: '接受邀请失败',
                    description: response.data,
                });
            }
        } catch (error) {
            console.error('接受邀请失败:', error);
            api.error({
                message: '接受邀请失败',
                description: '发生未知错误',
            });
        }
    };

    const rejectInvitation = async (teamId: number, captainId: number, notificationKey: string) => {
        try {
            const response = await HttpUtil.post(ApiUtil.API_REJECT_INVITATION, { userID: userID, teamID: teamId }) as ApiResponse<string>;
            if (response.status === 200) {
                api.success({
                    message: '拒绝邀请成功',
                    description: '你已成功拒绝团队邀请',
                });
                if (notificationKey !== '')
                    api.destroy(notificationKey);  // Destroy the notification
                setInvitations(invitations.filter(invitation => invitation.team_id !== teamId));
            } else {
                api.error({
                    message: '拒绝邀请失败',
                    description: response.data,
                });
            }
        } catch (error) {
            console.error('拒绝邀请失败:', error);
            api.error({
                message: '拒绝邀请失败',
                description: '发生未知错误',
            });
        }
    };

    const switchStatus = (newStatus: number) => {
        HttpUtil.post(ApiUtil.API_CHANGE_USER_STATUS,
            {
                status: newStatus,
                userID: localStorage.getItem('userID')
            }
        )
            .then((result: any) => {
                if (result.status === 200) {
                    setStatus(newStatus);
                    if (newStatus === 1)
                        message.success('用户状态已切换为在线');
                    else
                        message.success('用户状态已切换为隐身');
                } else {
                    message.error('状态切换失败');
                }
            })
            .catch(error => {
                console.error('Error changing status:', error);
                message.error('Error changing status');
            });
    };

    const handleUpload = (options: any) => {
        const { file, onSuccess, onError } = options;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userID', userID!.toString());

        HttpUtil.upload(ApiUtil.API_UPLOAD_AVATAR, formData)
            .then((response: any) => {
                console.log('Upload response:', response);
                if (response.status === 200) {
                    const normalizedPath = response.file_path.replace("\\", "/");  // 替换为正斜杠
                    setAvatarUrl(normalizedPath);
                    localStorage.setItem('avatarUrl', normalizedPath);
                    message.success('头像上传成功');
                    onSuccess(response.data, file);
                } else {
                    message.error('头像上传失败');
                    onError(new Error('Upload failed'));
                }
            })
            .catch(error => {
                console.error('Error uploading avatar:', error);
                message.error('Error uploading avatar');
                onError(error);
            });
    };



    const items: MenuProps['items'] = [
        {
            key: 'logout',
            onClick: logout,
            label: (
                <a>退出登录</a>
            ),
            icon: <SmileOutlined />
        },
        {
            key: 'uploadAvatar',
            label: (
                <Upload
                    showUploadList={false}
                    customRequest={handleUpload}
                >
                    <a>上传头像</a>
                </Upload>
            ),
            icon: <UploadOutlined />
        },
        {
            key: 'switchStatus',
            label: '切换状态',
            children: [
                {
                    key: 'online',
                    label: (
                        <a onClick={() => switchStatus(1)}>
                            {status === 1 ? '✅ ' : ''}在线
                        </a>
                    ),
                },
                {
                    key: 'invisible',
                    label: (
                        <a onClick={() => switchStatus(0)}>
                            {status === 0 ? '✅ ' : ''}隐身
                        </a>
                    ),
                },
            ],
        },
    ]

    const [collapsed, setCollapsed] = useState(false);

    const menuData: MenuDataItem[] = [
        { path: "/", name: "🏠  首页", default: true, icon: <HomeOutlined /> },
        { path: "/data-analysis", name: "📊  数据分析", icon: <AreaChartOutlined /> },
        { path: "/staff-list", name: "📆  日程表", icon: <CalendarOutlined /> },
        { path: "/notelist-page", name: "📒 笔记备忘录", icon: <FileTextOutlined /> },
        { path: "/reservation-page", name: "🚪  会议室预定", icon: <ContainerOutlined /> },
        { path: "/team-page", name: "👨‍👩‍👧‍👦 团队管理", icon: <TeamOutlined /> },
    ];
    const handleMenuDataRender = (menuData: MenuDataItem[]): MenuDataItem[] => {
        return menuData.map(item => ({
            ...item,
            icon: collapsed ? item.icon : null,
        }));
    };

    return (
        <ProLayout
            title="智能办公管理系统"
            logo={<div className="logo" />}
            layout="mix"
            navTheme="light"
            inlineCollapsed={collapsed}
            onCollapse={() => setCollapsed(!collapsed)}
            token={{
                header: {
                    heightLayoutHeader: 80, // 调整Header的高度
                },
                sider: {
                    colorBgMenuItemSelected: "#D2E5FF",
                    colorTextMenuSelected: '#253B7D'
                },
            }}
            headerRender={() => (
                <Header
                    className="header"
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        height: "80px",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <img
                            src={"./assets/logo.png"}
                            alt="logo"
                            style={{ width: 150, height: 60 }}
                        />
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <Dropdown
                            menu={{
                                items: [
                                  ...invitations.length === 0 && reservations.length === 0
                                    ? [{ key: 'empty', label: '暂无通知' }]
                                    : invitations.map((invitation) => ({
                                        key: invitation.team_id,
                                        label: (
                                          <div>
                                            团队 {invitation.team_id} 的邀请
                                            <Button
                                              type="link"
                                              onClick={() =>
                                                acceptInvitation(
                                                  invitation.team_id,
                                                  invitation.captain_id,
                                                  ''
                                                )
                                              }
                                            >
                                              接受
                                            </Button>
                                            <Button
                                              type="link"
                                              onClick={() =>
                                                rejectInvitation(
                                                  invitation.team_id,
                                                  invitation.captain_id,
                                                  ''
                                                )
                                              }
                                            >
                                              拒绝
                                            </Button>
                                          </div>
                                        ),
                                      })),
                                  ...reservations.map((reservation: any) => {
                                    const { id, room_id, room_name, reserve_user_id, reserve_user_name, team_id, team_name, date, start_time, end_time, type } = reservation;
                                    const key = `reservation-${id}`;
                                    const message = type === 0 ? '会议室预定通知' : '会议室取消通知';
                                    const description = type === 0
                                      ? `团队 ${team_name} 于 ${date} ${start_time} - ${end_time} 在 ${room_name} 预定了会议, 请注意查看`
                                      : `团队 ${team_name} 于 ${date} ${start_time} - ${end_time} 在 ${room_name} 取消了会议, 请注意查看`;
                                    return {
                                      key,
                                      label: (
                                        <div>
                                          {message}
                                          <div>{description}</div>
                                          <Button type='primary' onClick={() => acceptMeeting(id, type, key)}>已读</Button>
                                          <Button onClick={() => api.destroy(key)} style={{ marginLeft: '8px' }}>忽略</Button>
                                        </div>
                                      ),
                                    };
                                  }),
                                ],
                              }}
                              trigger={['click']}
                            >
                            <Badge count={invitations.length + reservations.length} offset={[-25, -2]} size='small'>
                                <BellOutlined
                                    style={{ fontSize: "24px", marginRight: "25px", cursor: "pointer" }}
                                />
                            </Badge>
                        </Dropdown>
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="avatar"
                                style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    marginRight: "8px",
                                }}
                            />
                        ) : (
                            <UserOutlined
                                style={{ fontSize: "24px", marginRight: "8px" }}
                            />
                        )}
                        <span>你好, {username}</span>
                        <Dropdown menu={{ items }} trigger={["click"]}>
                            <a
                                onClick={(e) => e.preventDefault()}
                                style={{ marginLeft: "8px" }}
                            >
                                <DownOutlined />
                            </a>
                        </Dropdown>
                    </div>
                </Header>
            )}
            menuItemRender={(item, dom) => <Link to={item.path || "/"}>{dom}</Link>}
            menuDataRender={() => handleMenuDataRender(menuData)}
        >
            {contextHolder}
            <Content style={{ padding: "0 24px 24px" }}>
                <Outlet />
            </Content>
        </ProLayout>
    );
};

export default MainLayout;
