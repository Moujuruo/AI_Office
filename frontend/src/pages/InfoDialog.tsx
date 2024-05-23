import { Modal, Form, Input, DatePicker, TimePicker, message } from 'antd';
import React, { useEffect, useState } from 'react';
import ApiUtil from '../utils/ApiUtil';
import HttpUtil from '../utils/HttpUtil';
import moment from 'moment';

interface ActivityDialogProps {
  visible: boolean;
  afterClose: () => void;
  onSave: (data: any) => void;
  editingItem: any | null;
}

const ActivityDialog: React.FC<ActivityDialogProps> = ({ visible, afterClose, onSave, editingItem }) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [success, setSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (success === true) {
      messageApi.success('活动保存成功！');
      setSuccess(null); // Reset success state
    } else if (success === false) {
      messageApi.error('活动保存失败！');
      setSuccess(null); // Reset success state
    }
  }, [success, messageApi]);

  useEffect(() => {
    if (editingItem) {
      form.setFieldsValue({
        ...editingItem,
        ActivityBeginDate: moment(editingItem.ActivityBeginDate),
        ActivityEndDate: moment(editingItem.ActivityEndDate),
        ActivityBeginTime: moment(editingItem.ActivityBeginTime, 'HH:mm:ss'),
        ActivityEndTime: moment(editingItem.ActivityEndTime, 'HH:mm:ss')
      });
    } else {
      form.resetFields();
    }
  }, [editingItem, form]);

  const handleOK = () => {
    form.validateFields().then((values: any) => {
      // Transform date and time fields to appropriate format
      const formattedValues = {
        ...values,
        ActivityBeginDate: values.ActivityBeginDate.format('YYYY-MM-DD'),
        ActivityEndDate: values.ActivityEndDate.format('YYYY-MM-DD'),
        ActivityBeginTime: values.ActivityBeginTime.format('HH:mm:ss'),
        ActivityEndTime: values.ActivityEndTime.format('HH:mm:ss'),
        UserID:localStorage.getItem('userID')||0
      };
      console.log("UserID:"+localStorage.getItem('userID'));
      HttpUtil.post(ApiUtil.API_Activity_UPDATE, formattedValues).then((data: any) => {
        setSuccess(true);
        afterClose();
        onSave(data);
      }).catch((err: any) => {
        setSuccess(false);
      });
    }).catch((err: any) => {
      messageApi.error('表单数据有误，请根据提示填写！');
    });
  };

  const handleCancel = () => {
    afterClose();
  };

  return (
    <Modal
      title="活动编辑"
      okText="保存"
      style={{ top: 20 }}
      width={500}
      afterClose={afterClose}
      onCancel={handleCancel}
      cancelText="取消"
      open={visible}
      onOk={handleOK}
      forceRender
    >
      {contextHolder}
      <div>
        <Form form={form} layout="horizontal">
          <Form.Item name="ActivityID" style={{ display: 'none' }}>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item label="活动名称" name="ActivityName" rules={[{ required: true, message: '请输入活动名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="开始日期" name="ActivityBeginDate" rules={[{ required: true, message: '请选择开始日期' }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item label="开始时间" name="ActivityBeginTime" rules={[{ required: true, message: '请选择开始时间' }]}>
            <TimePicker format="HH:mm:ss" />
          </Form.Item>
          <Form.Item label="结束日期" name="ActivityEndDate" rules={[{ required: true, message: '请选择结束日期' }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item label="结束时间" name="ActivityEndTime" rules={[{ required: true, message: '请选择结束时间' }]}>
            <TimePicker format="HH:mm:ss" />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default ActivityDialog;