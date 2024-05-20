import React from 'react';
import { Layout, Button, message } from 'antd';
import { ProTable, ProColumns } from '@ant-design/pro-components';
import Icon from '@ant-design/icons';
import InfoDialog from './InfoDialog';
import HttpUtil from '../utils/HttpUtil';
import ApiUtil from '../utils/ApiUtil';

const { Content } = Layout;

interface Datatype {
    key: React.Key;
    name: string;
    age: number;
    address: string;
}

interface TodoListState {
    showAdmin: boolean;
    show_back: string;
    showInfoDialog: boolean;
    editingItem: any;
    data: Datatype[];
}

class TodoList extends React.Component<{}, TodoListState> {
    state: TodoListState = {
        showAdmin: false,
        show_back: "none",
        showInfoDialog: false,
        editingItem: null,
        data: [],
    };

    columns: ProColumns<Datatype>[] = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: '800px',
        },
        {
            title: 'Age',
            dataIndex: 'age',
            key: 'age',
            render: (text) => {
                if (typeof text === 'number') {
                    return text > 40 ? <span style={{ color: 'red' }}>{text}</span> : text;
                }
                return null;
            },
            
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
        },
    ];

    admin_item: ProColumns<Datatype> = {
        title: '操作',
        render: (_, staff: Datatype) => (
            <span>
                <Icon type="edit" onClick={() => this.showUpdateDialog(staff)} />
                <Icon type="close" title="删除" style={{ color: '#ee6633', marginLeft: 12 }} onClick={() => this.deleteConfirm(staff)} />
            </span>
        ),
    };

    componentDidMount() {
        this.getData();
    }

    getData = () => {
        HttpUtil.get(ApiUtil.API_STAFF_LIST + 0)
            .then((response) => {
                const staffList = response as Datatype[];
                const staffListWithKeys = staffList.map((item, index) => ({
                    ...item,
                    key: item.key || index,
                }));
                this.setState({
                    data: staffListWithKeys,
                    showInfoDialog: false,
                });
            })
            .catch(error => {
                message.error(error.message);
            });
    };

    showUpdateDialog = (item?: Datatype) => {
        this.setState({
            showInfoDialog: true,
            editingItem: item || null,
        });
    };

    handleSave = (data: Datatype) => {
        this.getData();
    };

    deleteConfirm = (staff: Datatype) => {
        console.log("hi,deleteConfirm");
    };

    gotoAdmin = () => {
        this.setState({
            showAdmin: true,
            show_back: "block",
        });
    };

    onBack = () => {
        this.setState({
            showAdmin: false,
            show_back: "none",
        });
    };

    render() {
        const columns = this.state.showAdmin ? [...this.columns, this.admin_item] : this.columns;

        return (
            <Layout>
                <Content>
                    <div style={{ background: '#fff', padding: 24, minHeight: 480 }}>
                        <Button style={{ position: "absolute", right: "70px", top: "20px" }} onClick={() => this.showUpdateDialog()}>
                            添加
                        </Button>

                        <InfoDialog
                            visible={this.state.showInfoDialog}
                            afterClose={() => this.setState({ showInfoDialog: false })}
                            onSave={this.handleSave}
                            editingItem={this.state.editingItem}
                        />

                        <ProTable<Datatype>
                            columns={columns}
                            dataSource={this.state.data}
                            rowKey="key"
                            pagination={{ pageSize: 20 }}
                            scroll={{ y: 340 }}
                            search={false}
                            options={false}
                        />

                        <div style={{ position: "absolute", left: "10px", bottom: "10px" }}>
                            <a onClick={this.gotoAdmin}>管理员</a>
                        </div>
                        <div style={{ position: "absolute", left: "70px", bottom: "10px", display: this.state.show_back }}>
                            <a onClick={this.onBack}>返回</a>
                        </div>
                    </div>
                </Content>
            </Layout>
        );
    }
}

export default TodoList;
