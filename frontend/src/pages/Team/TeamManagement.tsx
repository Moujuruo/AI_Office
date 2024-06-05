import React, { useState } from 'react';
import { Row, Col } from 'antd';
import TeamCard from './TeamCard';
import CustomButton from './CustomButton';

const TeamManagement: React.FC = () => {
  const [teams, setTeams] = useState([
    {
      name: '团队A',
      members: [
        { name: 'Alice', avatar: 'https://i.pravatar.cc/300?img=1' },
        { name: 'Bob', avatar: 'https://i.pravatar.cc/300?img=2' },
        { name: 'Charlie', avatar: 'https://i.pravatar.cc/300?img=3' },
      ],
    },
    {
      name: '团队B',
      members: [],
    },
  ]);

  const handleAddMember = (teamIndex: number) => {
    const newMember = { name: `New Member ${teams[teamIndex].members.length + 1}`, avatar: 'https://i.pravatar.cc/300' };
    const newTeams = [...teams];
    newTeams[teamIndex].members.push(newMember);
    setTeams(newTeams);
  };

  const handleCreateTeam = () => {
    const newTeam = { name: `团队${String.fromCharCode(65 + teams.length)}`, members: [] };
    setTeams([...teams, newTeam]);
  };

  return (
    <div>
      <CustomButton onClick={handleCreateTeam} />
      <Row gutter={16} style={{ marginTop: '16px' }}>
        {teams.map((team, index) => (
          <Col key={index} span={8}>
            <TeamCard
              teamName={team.name}
              members={team.members}
              onAddMember={() => handleAddMember(index)}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default TeamManagement;
