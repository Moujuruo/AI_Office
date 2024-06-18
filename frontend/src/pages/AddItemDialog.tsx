import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Radio, message } from 'antd';
import ApiUtil from '../utils/ApiUtil';
import HttpUtil from '../utils/HttpUtil';
interface AddItemDialogProps {
    visible: boolean;
    onAdd: (item: any) => void;
    onCancel: () => void;
    activityId: number;
    ItemId : number;
    editingItem: any | null;
}

const AddItemDialog: React.FC<AddItemDialogProps> = ({ visible, onAdd, onCancel, activityId, ItemId,editingItem}) => {
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [success, setSuccess] = useState<boolean | null>(null);

    useEffect(() => {
        if (success === true) {
            messageApi.success('事项添加成功！');
            setSuccess(null);
        } else if (success === false) {
            messageApi.error('事项添加失败！');
            setSuccess(null);
        }
    }, [success, messageApi]);

    useEffect(() => {
        if (editingItem) {
          form.setFieldsValue({
            ...editingItem,
            ItemLevel: editingItem.ItemLevel,
            ItemContent: editingItem.ItemContent,
          });
        } else {
          form.resetFields();
        }
      }, [editingItem, form]);

    const handleOk = () => {
        form.validateFields().then((values: any) => {
            const formattedValues = {
                ...values,
                ActivityID: activityId,
                ItemID: editingItem ? editingItem.ItemID : undefined,
                UserID: localStorage.getItem('userID') || 0
            };
            HttpUtil.post(ApiUtil.API_Item_UPDATE, formattedValues)
                .then((data: any) => {
                    setSuccess(true);
                    onAdd(data);
                    form.resetFields();
                })
                .catch((err: any) => {
                    console.error('添加事项失败：', err);
                    setSuccess(false);
                });
        }).catch((err: any) => {
            messageApi.error('表单数据有误，请根据提示填写！');
        });
    };



    return (
        <Modal
            title="添加事项"
            open={visible}
            onOk={handleOk}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            okText="保存"
            cancelText="取消"
        >
            {contextHolder}
            <Form form={form} layout="vertical">
                <Form.Item
                    name="ItemContent"
                    label="事项内容"
                    rules={[{ required: true, message: '请输入事项内容' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="ItemLevel"
                    label="事项等级"
                    rules={[{ required: true, message: '请选择事项等级' }]}
                >
                    <Radio.Group>
                        <Radio value="重要但不紧急">重要但不紧急</Radio>
                        <Radio value="重要且紧急">重要且紧急</Radio>
                        <Radio value="不重要且不紧急">不重要且不紧急</Radio>
                        <Radio value="不重要且紧急">不重要且紧急</Radio>
                    </Radio.Group>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddItemDialog;

