import { Modal, Form, Input, message } from 'antd';
import React, { useEffect, useState } from 'react';
import ApiUtil from '../utils/ApiUtil';
import HttpUtil from '../utils/HttpUtil';

interface InfoDialogProps {
  visible: boolean;
  afterClose: () => void;
  onSave: (data: any) => void;
  editingItem: any | null;
}

const InfoDialog: React.FC<InfoDialogProps> = ({ visible, afterClose, onSave, editingItem }) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [success, setSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (success === true) {
      messageApi.success('保存成功！');
      setSuccess(null); // Reset success state
    } else if (success === false) {
      messageApi.error('保存失败！');
      setSuccess(null); // Reset success state
    }
  }, [success, messageApi]);

  useEffect(() => {
    if (editingItem) {
      form.setFieldsValue(editingItem);
    } else {
      form.resetFields();
    }
  }, [editingItem, form]);

  const handleOK = () => {
    form.validateFields().then((values: any) => {
      console.log("填写正确！");
      console.log(values);
      HttpUtil.post(ApiUtil.API_STAFF_UPDATE, values).then((data: any) => {
        console.log(data);
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
      title="信息编辑"
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
          <Form.Item name="id" style={{ display: 'none' }}>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="年龄" name="age" rules={[{ required: true, message: '请输入年龄' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="地址" name="address" rules={[{ required: true, message: '请输入地址' }]}>
            <Input />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default InfoDialog;
