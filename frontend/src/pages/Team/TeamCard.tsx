import React, { useState } from 'react';
import { Card, Avatar, Button, message, Popconfirm, Tooltip, Input } from 'antd';
import { CloseOutlined, DeleteOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons';
import HttpUtil from '../../utils/HttpUtil';
import ApiUtil from '../../utils/ApiUtil';
import { ApiResponse } from '../../utils/ApiUtil';

interface TeamCardProps {
  teamName: string;
  members: { 
    id: number, 
    avatar: string, 
    is_captain: number,
    member_name: string 
  }[];
  teamId: number;
  onAddMember: () => void;
  onDeleteTeam: () => void;
  onDeleteMember: (memberId: number) => void;
  onUpdateTeamName: (teamId: number, newName: string) => void; 
}

const TeamCard: React.FC<TeamCardProps> = ({ teamName, members, teamId, onAddMember, onDeleteTeam, onDeleteMember,  onUpdateTeamName}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTeamName, setEditedTeamName] = useState(teamName);

  const sortedMembers = [...members].sort((a, b) => b.is_captain - a.is_captain);

  const handleTeamNameDoubleClick = () => {
    setIsEditing(true);
  };

  const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTeamName(e.target.value);
  };

  const handleTeamNameSave = () => {
    onUpdateTeamName(teamId, editedTeamName);
    setIsEditing(false);
  };


  return (
    <Card
    title={
      isEditing ? (
        <Input
          value={editedTeamName}
          onChange={handleTeamNameChange}
          onPressEnter={handleTeamNameSave}
          onBlur={handleTeamNameSave}
          autoFocus
        />
      ) : (
        <span onDoubleClick={handleTeamNameDoubleClick}>
          {teamName} <span style={{ fontSize: 'small' }}>共 {members.length} 人</span>
        </span>
      )
    }
      bordered={true}
      style={{ width: 400, height: 200 }}
      actions={[
        <Popconfirm
          key="delete"
          title="确定要删除该团队吗？"
          onConfirm={onDeleteTeam}
          okText="确定"
          cancelText="取消"
        >
          <DeleteOutlined />
        </Popconfirm>,
      ]}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {sortedMembers.map((member, index) => (
          <Tooltip key={index} title={member.member_name}>
            <div style={{ marginRight: 8, position: 'relative' }}>
              {member.avatar ? (
                <img src={member.avatar} alt="avatar" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
              ) : (
                <UserOutlined style={{ fontSize: '24px' }} />
              )}
              {member.is_captain === 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: '2px solid #ffcc00',
                  }}
                />
              )}
              <Popconfirm
                title="确定要删除该成员吗？"
                onConfirm={() => onDeleteMember(member.id)}
                okText="确定"
                cancelText="取消"
              >
                <CloseOutlined
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    color: 'red',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0';
                  }}
                />
              </Popconfirm>
            </div>
          </Tooltip>
        ))}
        <Button type="dashed" shape="circle" icon={<UserAddOutlined />} onClick={onAddMember} />
      </div>
    </Card>
  );
};
export default TeamCard;