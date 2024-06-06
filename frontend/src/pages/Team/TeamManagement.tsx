import React, { useState, useEffect } from 'react';
import { Row, Col, message } from 'antd';
import TeamCard from './TeamCard';
import CustomButton from './CustomButton';
import ApiUtil from '../../utils/ApiUtil';
import HttpUtil from '../../utils/HttpUtil';

interface Member {
  member_id: number;
  is_captain: string;
}

interface Team {
  team_id: number;
  team_name: string;
  is_captain: number;
  members: Member[];
}

const TeamManagement: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await HttpUtil.post(ApiUtil.API_GET_ALL_TEAMS) as ApiResponse<Team[]>;
      if (response.status === 200) {
        setTeams(response.data);
      } else {
        message.error('获取团队列表失败');
      }
    } catch (error) {
      message.error('获取团队列表失败');
    }
  };

  const handleAddMember = async (teamId: number) => {
    // TODO: Implement adding a new member to the team
  };

  const handleCreateTeam = async () => {
    // TODO: Implement creating a new team
  };

  const getAvatarUrl = (memberId: number) => {
    return `${ApiUtil.API_GET_AVATOR_BY_ID}?user_id=${memberId}`;
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
                avatar: getAvatarUrl(member.member_id),
              }))}
              onAddMember={() => handleAddMember(team.team_id)}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default TeamManagement;