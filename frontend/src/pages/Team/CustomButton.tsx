import React from 'react';
import { TeamOutlined } from '@ant-design/icons';

interface CustomButtonProps {
  onClick: () => void;
}

const CustomButton: React.FC<CustomButtonProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#20BF55',
        color: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        cursor: 'pointer',
        width: '250px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ flexGrow: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: 'normal', marginBottom: '4px' }}>轻松管理</div>
          <div style={{ fontSize: '16px', fontWeight: 'normal', marginBottom: '8px' }}>你的团队工作</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          {/* <img src="/path/to/icon.png" alt="icon" style={{ width: '24px', height: '24px' }} /> */}
          <TeamOutlined style={{ fontSize: '35px', marginTop: '4px' }} />
        </div>
      </div>
      <div
        style={{
          backgroundColor: '#002766',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '16px',
          fontSize: '14px',
          fontWeight: 'normal',
          textAlign: 'center',
        }}
      >
        立即新建
      </div>
    </div>
  );
};

export default CustomButton;
