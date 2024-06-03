import React, { useState, useEffect, useRef } from 'react';
import { Button, DatePicker, Input, Form } from 'antd';
import { LeftOutlined, RightOutlined, ReloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import ReservationModal from './ReservationModal';

const { Search } = Input;

const meetingRooms = [
  { name: 'F1-3-1', capacity: 20 },
  { name: 'F1-3-2', capacity: 20 },
  { name: 'F1-3-3', capacity: 20 },
];

const initialReservations = [
  { room: 'F1-3-1', startTime: '13:00', endTime: '15:00', date: '2024-06-03' },
  { room: 'F1-3-2', startTime: '09:30', endTime: '11:15', date: '2024-06-03' },
];

const RoomBooking = () => {
  const [selectedDate, setSelectedDate] = useState(moment());
  const [filteredRooms, setFilteredRooms] = useState(meetingRooms);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [reservations, setReservations] = useState(initialReservations);

  const scrollRef = useRef(null);

  useEffect(() => {
    filterRooms();
  }, [selectedDate]);

  const filterRooms = (value = '') => {
    const filtered = meetingRooms.filter(room => room.name.includes(value));
    setFilteredRooms(filtered);
  };

  const handleSearch = (value: string) => {
    filterRooms(value);
  };

  const handleDateChange = (date: moment.Moment | null) => {
    setSelectedDate(date ? date : moment());
  };

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const capacity = parseInt(e.target.value, 10);
    const filtered = meetingRooms.filter(room => room.capacity >= capacity);
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

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const newReservation = {
        room: values.room,
        startTime: moment().startOf('day').add(values.time[0], 'hours').format('HH:mm'),
        endTime: moment().startOf('day').add(values.time[1], 'hours').format('HH:mm'),
        date: values.date.format('YYYY-MM-DD'),
      };
      setReservations([...reservations, newReservation]);
      setModalVisible(false);
    });
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  const renderReservations = (room: any) => {
    return reservations
      .filter(res => res.room === room.name && res.date === selectedDate.format('YYYY-MM-DD'))
      .map((res, index) => {
        const start = moment(res.startTime, 'HH:mm');
        const end = moment(res.endTime, 'HH:mm');
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
          <div key={room.name} style={{ display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
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
      />
    </div>
  );
};

export default RoomBooking;
