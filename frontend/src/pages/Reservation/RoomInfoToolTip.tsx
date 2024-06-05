import React from 'react';
import { Tooltip } from 'antd';
import moment from 'moment';


interface Room {
    id: number;
    name: string;
    capacity: number;
    floor: number;
    equipment: string;
}

interface Reservation {
    room_id: number;
    start_time: string;
    end_time: string;
    date: string;
}

interface RoomInfoTooltipProps {
  room: Room;
  reservations: Reservation[];
  selectedDate: moment.Moment;
}

const RoomInfoTooltip: React.FC<RoomInfoTooltipProps> = ({ room, reservations, selectedDate }) => {
    const { name, capacity, floor, equipment } = room;
  
    const formatEquipment = (equipmentData: string) => {
      try {
        const equipmentArray = JSON.parse(equipmentData).设备;
        // 新建一个字符串，循环遍历每个equipment
        let formattedEquipment = '';
        equipmentArray.forEach((equipment: string) => {
          formattedEquipment += `${equipment}\n`;
        }
        );
        return formattedEquipment;
      } catch (error) {
        console.error('解析设备数据错误：', error);
        return '';
      }
    };

    const roomReservations = reservations.filter(
        (res) => res.room_id === room.id && res.date === selectedDate.format('YYYY-MM-DD')
      );
    
      // 格式化预约时间
      const formatReservationTime = (startTime: string, endTime: string) => {
        return `${startTime} - ${endTime}`;
      };
  
    return (
      <Tooltip placement='right'
        title={
          <div>
            <p>会议室名称：{name}</p>
            <p>容纳人数：{capacity}</p>
            <p>楼层：{floor}</p>
            <p>设备：{formatEquipment(equipment)}</p>
            <div>
              <p>已预约时间：</p>
              <ul>
                {roomReservations.map((res, index) => (
                  <li key={index}>{formatReservationTime(res.start_time, res.end_time)}</li>
                ))}
              </ul>
            </div>
          </div>
        }
      >
        <div>{name}</div>
      </Tooltip>
    );
};

export default RoomInfoTooltip;