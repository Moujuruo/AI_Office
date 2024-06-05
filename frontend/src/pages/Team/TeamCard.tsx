import React from 'react';
import { Card, Avatar, Button } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';

interface TeamCardProps {
  teamName: string;
  members: { name: string, avatar: string }[];
  onAddMember: () => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ teamName, members, onAddMember }) => {
  return (
    <Card
      title={<span>{teamName} <span style={{ fontSize: 'small' }}>共 {members.length} 人</span></span>}
      bordered={true}
      style={{ width: 400, height: 200 }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {members.map((member, index) => (
          <Avatar key={index} src={member.avatar} style={{ marginRight: 8 }} />
        ))}
        <Button type="dashed" shape="circle" icon={<UserAddOutlined />} onClick={onAddMember} />
      </div>
    </Card>
  );
};

export default TeamCard;
