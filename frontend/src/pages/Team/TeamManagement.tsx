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
  is_captain: string;
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
                console.log("========", avatarUrl);
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
    <div>
      <CustomButton onClick={handleCreateTeam} />
      <Row gutter={16} style={{ marginTop: '16px' }}>
        {teams.map((team) => (
          <Col key={team.team_id} span={8}>
            <TeamCard
              teamName={team.team_name}
              members={team.members.map((member) => ({
                name: `Member ${member.member_id}`,
                avatar: member.avatar,
              }))}
              onAddMember={() => handleAddMember(team.team_id)}
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
  );
};

export default TeamManagement;