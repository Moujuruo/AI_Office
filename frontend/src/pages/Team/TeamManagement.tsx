import React, { useState, useEffect } from 'react';
import { Row, Col, message, Modal, Input } from 'antd';
import TeamCard from './TeamCard';
import CustomButton from './CustomButton';
import ApiUtil from '../../utils/ApiUtil';
import HttpUtil from '../../utils/HttpUtil';
import { ApiResponse } from '../../utils/ApiUtil';
import QueueAnim from 'rc-queue-anim';

interface Member {
  member_id: number;
  is_captain: number;
  username: string;
  avatar: string;
}

interface Team {
  team_id: number;
  team_name: string;
  is_captain: number;
  members: Member[];
}

interface Avatar {
  avatar: string;
  status: string;
}

const TeamManagement: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [invitedMemberName, setInvitedMemberName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const deleteTeam = async (teamId: number) => {
    try {
      const userId = localStorage.getItem('userID') || 1;
      const response = await HttpUtil.post(ApiUtil.API_DELETE_TEAM, { userID: userId, teamID: teamId }) as ApiResponse<string>;
      if (response.status === 200) {
        message.success('删除团队成功');
        setTeams(teams.filter(team => team.team_id !== teamId)); // 更新状态
      } else if (response.status === 400) {
        message.error('你没有权限删除该团队');
      } else {
        message.error('删除团队失败');
      }
    } catch (error) {
      message.error('删除团队失败');
    }
  };

  const updateTeamName = async (teamId: number, newName: string) => {
    try {
      const userId = localStorage.getItem('userID') || 1;
      const response = await HttpUtil.post(ApiUtil.API_UPDATE_TEAM_NAME, { userID: userId, teamID: teamId, teamName: newName }) as ApiResponse<string>;
      if (response.status === 200) {
        message.success('更新团队名称成功');
        fetchTeams();
      } else {
        message.error('更新团队名称失败');
      }
    } catch (error) {
      message.error('更新团队名称失败');
    }
  };

  const deleteTeamMember = async (teamId: number, memberId: number) => {
    try {
      const userId = localStorage.getItem('userID') || 1;
      const response = await HttpUtil.post(ApiUtil.API_DELETE_MEMBER, { userID: userId, teamID: teamId, memberID: memberId }) as ApiResponse<string>;
      if (response.status === 200) {
        message.success('删除团队成员成功');
        fetchTeams();
      } else if (response.status === 400) {
        message.error(response.data);
      } else {
        message.error('删除团队失败');
      }
    } catch (error) {
      message.error('删除团队失败');
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await HttpUtil.post(ApiUtil.API_GET_ALL_TEAMS,
        {
          userID: localStorage.getItem('userID')
        }
      ) as ApiResponse<Team[]>;
      if (response.status === 200) {
        const teamsWithAvatar = await Promise.all(
          response.data.map(async (team) => {
            const membersWithAvatar = await Promise.all(
              team.members.map(async (member) => {
                const avatarUrl = await getAvatarUrl(member.member_id);
                console.log("========", member);
                return { ...member, avatar: avatarUrl };
              })
            );
            return { ...team, members: membersWithAvatar };
          })
        );
        setTeams(teamsWithAvatar);
      } else {
        message.error('获取团队列表失败');
      }
    } catch (error) {
      message.error('获取团队列表失败');
    }
  };

  const getAvatarUrl = async (memberId: number): Promise<string> => {
    try {
      const response = await HttpUtil.get(ApiUtil.API_GET_AVATOR_BY_ID + `?user_id=${memberId}`
      ) as ApiResponse<Avatar>;
      if (response.status === 200) {
        console.log(response.data.avatar);
        return response.data.avatar;
      } else {
        return '';
      }
    } catch (error) {
      return '';
    }
  };

  const handleCreateTeam = async () => {
    setCreateModalVisible(true);
  };

  const handleCreateTeamOk = async () => {
    if (newTeamName.trim() === '') {
      message.error('团队名称不能为空');
      return;
    }

    try {
      const response = await HttpUtil.post(ApiUtil.API_INSERT_TEAM, {
        userID: localStorage.getItem('userID'),
        teamName: newTeamName,
      }) as ApiResponse<string>;

      if (response.status === 200) {
        message.success('创建团队成功');
        setCreateModalVisible(false);
        setNewTeamName('');
        fetchTeams();
      } else {
        message.error('创建团队失败');
      }
    } catch (error) {
      message.error('创建团队失败');
    }
  };

  const handleCreateTeamCancel = () => {
    setCreateModalVisible(false);
    setNewTeamName('');
  };

  const handleAddMember = async (teamId: number) => {
    setSelectedTeamId(teamId);
    setInviteModalVisible(true);
  };

  const handleInviteMemberOk = async () => {
    if (invitedMemberName.trim() === '') {
      message.error('成员名称不能为空');
      return;
    }

    if (selectedTeamId === null) {
      message.error('未选择团队');
      return;
    }

    try {
      const response = await HttpUtil.post(ApiUtil.API_INVITE_MEMBER, {
        teamID: selectedTeamId,
        member_name: invitedMemberName,
      }) as ApiResponse<string>;

      if (response.status === 200) {
        message.success(response.data);
        setInviteModalVisible(false);
        setInvitedMemberName('');
        setSelectedTeamId(null);
        fetchTeams();
      } else {
        message.error(response.data);
      }
    } catch (error) {
      message.error('邀请成员失败');
    }
  };

  const handleInviteMemberCancel = () => {
    setInviteModalVisible(false);
    setInvitedMemberName('');
    setSelectedTeamId(null);
  };

  return (
    <div
      style={{
        minHeight: 880,
        background: "#ffffff",
        borderRadius: 10,
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        paddingTop: 20,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 30,
      }}
    >
      <div>
        <CustomButton onClick={handleCreateTeam} />
        <Row gutter={16} style={{ marginTop: '16px' }}>
          {teams.map((team) => (
            <Col key={team.team_id} >
              <TeamCard
                teamName={team.team_name}
                members={team.members.map((member) => ({
                  id: member.member_id,
                  avatar: member.avatar,
                  is_captain: member.is_captain,
                  member_name: member.username
                }))}
                teamId={team.team_id}
                onAddMember={() => handleAddMember(team.team_id)}
                onDeleteTeam={() => deleteTeam(team.team_id)}
                onDeleteMember={(memberId) => deleteTeamMember(team.team_id, memberId)}
                onUpdateTeamName={updateTeamName}
              />
            </Col>
          ))}
        </Row>
        <Modal
          title="创建团队"
          open={createModalVisible}
          onOk={handleCreateTeamOk}
          onCancel={handleCreateTeamCancel}
        >
          <Input
            placeholder="请输入团队名称"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
          />
        </Modal>
        <Modal
          title="邀请成员"
          open={inviteModalVisible}
          onOk={handleInviteMemberOk}
          onCancel={handleInviteMemberCancel}
        >
          <Input
            placeholder="请输入要邀请的成员名称"
            value={invitedMemberName}
            onChange={(e) => setInvitedMemberName(e.target.value)}
          />
        </Modal>
      </div>
    </div>
  );
};

export default TeamManagement;