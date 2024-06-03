import React, { useState, useEffect, useRef } from 'react';
import { Button, DatePicker, Input, Form, message } from 'antd';
import { LeftOutlined, RightOutlined, ReloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import ReservationModal from './ReservationModal';
import HttpUtil from '../../utils/HttpUtil';
import ApiUtil from '../../utils/ApiUtil';

const { Search } = Input;

interface ApiResponse<T> {
    status: number;
    data: T;
}

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

const RoomBooking = () => {
  const [selectedDate, setSelectedDate] = useState(moment());
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [floorFilter, setFloorFilter] = useState<string>('');
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchRooms();
  }, []); // 组件首次渲染时调用 fetchRooms

  useEffect(() => {
    fetchReservations(selectedDate.format('YYYY-MM-DD'));
  }, [selectedDate]);

  const fetchRooms = async (value = '') => {
    try {
      const response = await HttpUtil.post(ApiUtil.API_GET_ALL_ROOMS, { search: value }) as ApiResponse<Room[]>;
      console.log(response);
      if (response.status === 200) {
        setFilteredRooms(response.data);
      } else {
        message.error('获取会议室信息失败');
      }
    } catch (error) {
      message.error('获取会议室信息失败');
    }
  };

  const fetchReservations = async (date: string) => {
    try {
      console.log(date);
      const response = await HttpUtil.post(ApiUtil.API_GET_ALL_RESERVATIONS, { date }) as ApiResponse<Reservation[]>;
      console.log(response);
      if (response.status === 200) {
        setReservations(response.data);
      } else {
        message.error('获取预定信息失败');
      }
    } catch (error) {
      message.error('获取预定信息失败');
    }
  };

  const filterRooms = (value = '') => {
    const filtered = filteredRooms.filter(room => room.name.includes(value) && room.floor.toString().includes(floorFilter));
    setFilteredRooms(filtered);
  };

  const handleSearch = (value: string) => {
    fetchRooms(value);
  };

  const handleDateChange = (date: moment.Moment | null) => {
    setSelectedDate(date ? date : moment());
  };

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const capacity = parseInt(e.target.value, 10);
    const filtered = filteredRooms.filter(room => room.capacity >= capacity && room.floor.toString().includes(floorFilter));
    setFilteredRooms(filtered);
  };

  const handleFloorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const floor = e.target.value;
    setFloorFilter(floor);
    const filtered = filteredRooms.filter(room => room.floor.toString().includes(floor) && room.capacity.toString().includes(floor));
    setFilteredRooms(filtered);
  };

  const handleRefresh = () => {
    setSelectedDate(moment());
  };

  const handlePreviousDay = () => {
    setSelectedDate(prev => moment(prev).subtract(1, 'days'));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => moment(prev).add(1, 'days'));
  };

  const handleCreateReservation = () => {
    form.resetFields();
    setModalVisible(true);
  };

//   const handleModalOk = (values: any) => {
//     const newReservation = {
//       room_id: values.room_id,
//       start_time: moment().startOf('day').add(values.time[0], 'hours').format('HH:mm'),
//       end_time: moment().startOf('day').add(values.time[1], 'hours').format('HH:mm'),
//       date: values.date.format('YYYY-MM-DD'),
//     };
//     setReservations([...reservations, newReservation]);
//     setModalVisible(false);
//   };

    const handleModalOk = () => {
    // 重新获取预约信息
        fetchReservations(selectedDate.format('YYYY-MM-DD'));
        setModalVisible(false);
    };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  const renderReservations = (room: any) => {
    console.log(room);
    console.log(reservations);
    return reservations
      .filter(res => res.room_id === room.id && res.date === selectedDate.format('YYYY-MM-DD'))
      .map((res, index) => {
        console.log(res);
        const start = moment(res.start_time, 'HH:mm');
        const end = moment(res.end_time, 'HH:mm');
        const duration = moment.duration(end.diff(start)).asHours();
        const startOffset = moment.duration(start.diff(moment(start).startOf('day').add(8, 'hours'))).asHours();
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `calc(${startOffset * 100 / 15}%)`,
              width: `calc(${duration * 100 / 15}%)`,
              height: '100%',
              backgroundColor: 'yellow',
              opacity: 0.7,
              border: '1px solid #ccc',
              boxSizing: 'border-box'
            }}
          >
            已预约
          </div>
        );
      });
  };

  const renderTimeSlots = () => {
    return Array.from({ length: 15 }, (_, hour) => (
      <div key={hour} style={{ position: 'relative', width: 'calc(100% / 15)', textAlign: 'center', lineHeight: '30px', borderLeft: '1px solid #ccc' }}>
        {`${hour + 8}:00`}
      </div>
    ));
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button onClick={handlePreviousDay} icon={<LeftOutlined />} />
        <DatePicker value={selectedDate} onChange={handleDateChange} />
        <Button onClick={handleNextDay} icon={<RightOutlined />} />
        <Search placeholder="请输入关键字" onSearch={handleSearch} style={{ width: 200, marginLeft: 16 }} />
        <Input placeholder="容纳人数" type="number" onChange={handleCapacityChange} style={{ width: 100, marginLeft: 16 }} />
        <Input placeholder="楼层" type="number" onChange={handleFloorChange} style={{ width: 100, marginLeft: 16 }} />
        <Button onClick={handleRefresh} icon={<ReloadOutlined />} style={{ marginLeft: 16 }} />
        <Button type="primary" onClick={handleCreateReservation} style={{ marginLeft: 16 }}>创建预约</Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', overflowX: 'auto' }} ref={scrollRef}>
        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
          <div style={{ width: '150px' }}></div>
          <div style={{ display: 'flex', flexDirection: 'row', flex: '1' }}>
            {renderTimeSlots()}
          </div>
        </div>
        {filteredRooms.map(room => (
          <div key={room.id} style={{ display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
            <div style={{ width: '150px', textAlign: 'center', lineHeight: '50px', border: '1px solid #ccc', borderRight: 'none', }}>
              {room.name}
            </div>
            <div style={{ position: 'relative', width: 'calc(100% - 150px)', border: '1px solid #ccc', height: '50px' }}>
              {renderReservations(room)}
              {Array.from({ length: 15 }, (_, hour) => (
                <div key={hour} style={{ position: 'absolute', left: `calc(${hour * 100 / 15}% )`, height: '50px', width: 'calc(100% / 15)', borderLeft: '1px solid #ccc' }}>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ReservationModal
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        form={form}
        meetingRooms={filteredRooms}
        fetchReservations={fetchReservations}
        reservations={reservations}
        />
    </div>
  );
};

export default RoomBooking;

