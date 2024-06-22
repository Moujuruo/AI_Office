import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, DatePicker, Input, Slider, message } from 'antd';
import moment from 'moment';
import HttpUtil from '../../utils/HttpUtil';
import ApiUtil from '../../utils/ApiUtil';
import { ApiResponse } from '../../utils/ApiUtil';

const { Option } = Select;

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
  subject: string;
}

interface Member {
  member_id: number;
  is_captain: number;
}

interface Team {
  team_id: number;
  team_name: string;
  is_captain: number;
  members: Member[];
}

interface ReservationModalProps {
    visible: boolean;
    onOk: () => void;
    onCancel: () => void;
    form: any;
    meetingRooms: Room[];
    fetchReservations: (date: string) => void;
    reservations: Reservation[];
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  visible,
  onOk,
  onCancel,
  form,
  meetingRooms,
  fetchReservations,
  reservations,
}) => {
  const [sliderValue, setSliderValue] = useState<number[]>([8, 9]);
  const [room, setRoom] = useState<number>(meetingRooms[0]?.id || 0);
  const [bookedTimes, setBookedTimes] = useState<[number, number][]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [bookingType, setBookingType] = useState<string>('personal');


  useEffect(() => {
    form.setFieldsValue({
      person: localStorage.getItem('username') || '默认用户',
    });
  }, [form]);

  useEffect(() => {
    if (room && form.getFieldValue('date')) {
      fetchBookedTimes(room, form.getFieldValue('date').format('YYYY-MM-DD'));
    }
  }, [room, form.getFieldValue('date')]);

  const fetchBookedTimes = async (roomId: number, date: string) => {
    try {
      const response = await HttpUtil.post(ApiUtil.API_GET_ROOM_RESERVATIONS, { room_id: roomId, date }) as ApiResponse<Reservation[]>;
      if (response.status === 200) {
        const times: [number, number][] = response.data.map(reservation => [
          moment(reservation.start_time, 'HH:mm').hour(),
          moment(reservation.end_time, 'HH:mm').hour()
        ]);
        setBookedTimes(times);
      } else {
        message.error('获取预定信息失败');
      }
    } catch (error) {
      message.error('获取预定信息失败');
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await HttpUtil.post(ApiUtil.API_GET_ALL_TEAMS,
        {
          userID: localStorage.getItem('userID')
        }
      ) as ApiResponse<Team[]>;
      if (response.status === 200) {
        const userID = localStorage.getItem('userID');
        const filteredTeams = response.data.filter((team) => {
          console.log(team);
          return team.is_captain === 1;
        });
        setTeams(filteredTeams);
        console.log(filteredTeams);
      } else {
        message.error('获取团队列表失败');
      }
    } catch (error) {
      message.error('获取团队列表失败');
    }
  };
  

  const marks = {
    8: '08:00',
    22: '22:00',
  };

  const bookedMarks = bookedTimes.reduce((acc: any, [start, end]) => {
    acc[start] = {
      style: { color: 'red' },
      label: `${start}:00`,
    };
    acc[end] = {
      style: { color: 'blue' },
      label: `${end}:00`,
    };
    return acc;
  }, {});

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
  };

  const formatSliderTooltip = (value?: number) => {
    if (value === undefined) return '';
    const hours = Math.floor(value);
    const minutes = (value - hours) * 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleDateChange = (date: moment.Moment | null) => {
    if (date) {
      fetchBookedTimes(room, date.format('YYYY-MM-DD'));
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const newReservation = {
        room_id: values.room_id,
        user_id: localStorage.getItem('userID') || 1,
        start_time: moment().startOf('day').add(values.time[0], 'hours').format('HH:mm'),
        end_time: moment().startOf('day').add(values.time[1], 'hours').format('HH:mm'),
        date: values.date.format('YYYY-MM-DD'),
        subject: values.title,
        type: bookingType,
      };
      const response = await HttpUtil.post(ApiUtil.API_INSERT_RESERVATION, newReservation) as ApiResponse<any>;
      if (response.status === 200) {
        message.success('预约成功');
        onOk();
      } else {
        message.error('预约失败');
      }
    } catch (error) {
      message.error('预约失败');
    }
  };

  const handleBookingTypeChange = (value: string) => {
    setBookingType(value);
    if (value === 'team') {
      fetchTeams();
    }
  };

  return (
    <Modal title="创建预约" open={visible} onOk={form.submit} onCancel={onCancel}>
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item name="title" label="会议主题" rules={[{ required: true, message: '请输入会议主题' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="bookingType" label="预约类型" rules={[{ required: true, message: '请选择预约类型' }]}>
        <Select onChange={handleBookingTypeChange}>
          <Option value="personal">个人预约</Option>
          <Option value="team">团队预约</Option>
        </Select>
      </Form.Item>
      {bookingType === 'team' && (
        <Form.Item name="teamId" label="选择团队" rules={[{ required: true, message: '请选择团队' }]}>
          <Select>
            {teams.map(team => (
              <Option key={team.team_id} value={team.team_id}>{team.team_name}</Option>
            ))}
          </Select>
        </Form.Item>
      )}
      <Form.Item name="room_id" label="会议室" rules={[{ required: true, message: '请选择会议室' }]}>
        <Select onChange={(value: number) => setRoom(value)} value={room}>
          {meetingRooms.map(room => (
            <Option key={room.id} value={room.id}>{room.name}</Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
        <DatePicker onChange={handleDateChange} />
      </Form.Item>
        <Form.Item name="time" label="选择时间段" rules={[{ required: true, message: '请选择时间段' }]}>
          <Slider
            range
            min={8}
            max={22}
            defaultValue={[8, 22]}
            step={0.25}
            marks={{ ...marks, ...bookedMarks }}
            value={sliderValue}
            onChange={handleSliderChange}
            tooltip={{ formatter: formatSliderTooltip }}
          />
        </Form.Item>
       
      </Form>
    </Modal>
  );
};

export default ReservationModal;
