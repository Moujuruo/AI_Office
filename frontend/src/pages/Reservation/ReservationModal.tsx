import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, DatePicker, Input, Slider } from 'antd';
import moment from 'moment';

const { Option } = Select;

interface ReservationModalProps {
    visible: boolean;
    onOk: () => void;
    onCancel: () => void;
    form: any;
  }
  
  const bookedTimes: Record<string, [number, number][]> = {
    'F1-3-1': [[9, 10], [14, 15]],
    'F1-3-2': [[11, 12], [13, 14]],
    'F1-3-3': [[8, 9], [16, 17]],
  };
  
  const meetingRooms = [
    { name: 'F1-3-1' },
    { name: 'F1-3-2' },
    { name: 'F1-3-3' },
  ];
  
  const ReservationModal: React.FC<ReservationModalProps> = ({ visible, onOk, onCancel, form }) => {
    const [sliderValue, setSliderValue] = useState<number[]>([8, 9]);
    const [room, setRoom] = useState<string>(meetingRooms[0].name);
  
    useEffect(() => {
      form.setFieldsValue({
        person: localStorage.getItem('username') || '默认用户',
      });
    }, [form]);
  
    const marks = {
      8: '08:00',
      22: '22:00',
    };
  
    const bookedMarks = bookedTimes[room].reduce((acc: any, [start, end]) => {
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
  
    return (
      <Modal title="创建预约" open={visible} onOk={form.submit} onCancel={onCancel}>
        <Form form={form} layout="vertical" onFinish={onOk}>
          <Form.Item name="room" label="会议室" rules={[{ required: true, message: '请选择会议室' }]}>
            <Select onChange={(value: string) => setRoom(value)} value={room}>
              {meetingRooms.map(room => (
                <Option key={room.name} value={room.name}>{room.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker />
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
          <Form.Item name="title" label="会议主题" rules={[{ required: true, message: '请输入会议主题' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    );
  };
  
  export default ReservationModal;