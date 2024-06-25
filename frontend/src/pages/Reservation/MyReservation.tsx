import React, { useEffect, useState } from 'react';
import { Modal, Table, Button, message, DatePicker, TimePicker } from 'antd';
import moment from 'moment';
import dayjs from 'dayjs';
import HttpUtil from '../../utils/HttpUtil';
import ApiUtil from '../../utils/ApiUtil';
import { ApiResponse } from "../../utils/ApiUtil";

interface Reservation {
  id: number;
  room_id: number;
  start_time: string;
  end_time: string;
  date: string;
  room_name: string;
  subject: string;
}

interface MyReservationsModalProps {
  visible: boolean;
  onCancel: () => void;
  fetchReservations: (date: string) => void;
}

const MyReservationsModal: React.FC<MyReservationsModalProps> = ({
  visible,
  onCancel,
  fetchReservations,
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (visible) {
      fetchMyReservations();
    }
  }, [visible]);

  const fetchMyReservations = async () => {
    try {
      const userId = localStorage.getItem('userID') || 1; 
      const response = await HttpUtil.post(ApiUtil.API_GET_USER_RESERVATIONS, { user_id: userId }) as ApiResponse<Reservation[]>;
      if (response.status === 200) {
        setReservations(response.data);
      } else {
        message.error('获取我的预约信息失败');
      }
    } catch (error) {
      message.error('获取我的预约信息失败');
    }
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    setPageSize(pageSize || 10);
  };


  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation); 
  };

  const handleDelete = async (reservationId: number) => {
    try {
      const response = await HttpUtil.post(ApiUtil.API_DELETE_RESERVATION, { reservation_id: reservationId, user_id: localStorage.getItem('userID')}) as ApiResponse<any>;
      if (response.status === 200) {
        message.success('删除预约成功');
        fetchMyReservations();
        fetchReservations(moment().format('YYYY-MM-DD')); // Fetch reservations for the current date
      } else {
        message.error('删除预约失败');
      }
    } catch (error) {
      message.error('删除预约失败');
    }
  };

  const handleSave = async () => {
    if (editingReservation) {
      try {
        const response = await HttpUtil.post(ApiUtil.API_UPDATE_RESERVATION, editingReservation) as ApiResponse<any>;
        if (response.status === 200) {
          message.success('更新预约成功');
          setEditingReservation(null);
          fetchMyReservations();
          fetchReservations(moment().format('YYYY-MM-DD')); // Fetch reservations for the current date
        } else {
          message.error('更新预约失败');
        }
      } catch (error) {
        message.error('更新预约失败');
      }
    }
  };

  const handleCancel = () => {
    setEditingReservation(null);
  };

  const handleDateChange = (date: moment.Moment | null, reservationId: number) => {
    if (date && editingReservation && editingReservation.id === reservationId) {
      setEditingReservation({ ...editingReservation, date: date.format('YYYY-MM-DD') });
    }
  };

  const handleStartTimeChange = (time: dayjs.Dayjs | null, reservationId: number) => {
    if (time && editingReservation && editingReservation.id === reservationId) {
      setEditingReservation({ ...editingReservation, start_time: time.format('HH:mm') });
    }
  };

  const handleEndTimeChange = (time: dayjs.Dayjs | null, reservationId: number) => {
    if (time && editingReservation && editingReservation.id === reservationId) {
      setEditingReservation({ ...editingReservation, end_time: time.format('HH:mm') });
    }
  };

  const columns = [
    {
      title: '会议室',
      dataIndex: 'room_name',
      key: 'room_name',
    },
    {
        title: '会议主题',
        dataIndex: 'subject',
        key: 'subject',

    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (text: string, record: Reservation) => (
        <DatePicker
          value={moment(record.date)}
          onChange={(date) => handleDateChange(date, record.id)}
          disabled={editingReservation?.id !== record.id}
        />
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (text: string, record: Reservation) => (
        <TimePicker
          value={dayjs(record.start_time, 'HH:mm')}
          onChange={(time) => handleStartTimeChange(time, record.id)}
          disabled={editingReservation?.id !== record.id}
        />
      ),
    },
    {
      title: '结束时间',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (text: string, record: Reservation) => (
        <TimePicker
          value={dayjs(record.end_time, 'HH:mm')}
          onChange={(time) => handleEndTimeChange(time, record.id)}
          disabled={editingReservation?.id !== record.id}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (text: string, record: Reservation) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            {editingReservation?.id === record.id ? '保存' : '编辑'}
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </>
      ),
    },
  ];

  return (
    <Modal
      title="我的预约"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          关闭
        </Button>,
        <Button key="save" type="primary" onClick={handleSave} disabled={!editingReservation}>
          保存
        </Button>,
      ]}
      width={800}
    >
      <Table
        dataSource={reservations}
        columns={columns}
        rowKey="id"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: reservations.length,
          onChange: handlePageChange,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
    </Modal>
  );
};

export default MyReservationsModal;