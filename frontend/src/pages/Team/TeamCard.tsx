import React from 'react';
import { Card, Avatar, Button } from 'antd';
import { UserAddOutlined, UserOutlined } from '@ant-design/icons';

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
          <div key={index} style={{ marginRight: 8 }}>
            {member.avatar ? (
              <img src={member.avatar} alt="avatar" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
            ) : (
              <UserOutlined style={{ fontSize: '24px' }} />
            )}
          </div>
        ))}
        <Button type="dashed" shape="circle" icon={<UserAddOutlined />} onClick={onAddMember} />
      </div>
    </Card>
  );
};

export default TeamCard;
