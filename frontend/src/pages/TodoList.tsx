import React from 'react';
import { Layout, Button,Input, message, Modal, Collapse } from 'antd';
import { ProTable, ProColumns } from '@ant-design/pro-components';
import {EditOutlined, CloseOutlined, PlusOutlined, SearchOutlined} from '@ant-design/icons';
import InfoDialog from './InfoDialog';
import AddItemDialog from './AddItemDialog';
import HttpUtil from '../utils/HttpUtil';
import ApiUtil from '../utils/ApiUtil';

const { Content } = Layout;
const {Panel} = Collapse;
const { Search } = Input;


export interface TodoItem {
    ItemID: number;       // 事项ID，整数类型
    ActivityID: number;   // 活动ID，整数类型，关联到活动表中的活动ID
    UserID: number;       // 用户ID，整数类型，关联到用户表中的用户ID
    ItemContent: string;  // 事项内容，字符串类型
    ItemLevel: number;    // 事项等级，整数类型
}


interface TodoActivity {
    ActivityID: number;
    UserID: number;
    ActivityName: string;
    ActivityBeginDate: string;
    ActivityBeginTime: string;
    ActivityEndDate: string;
    ActivityEndTime: string;
    items: TodoItem[]; // 新增的字段
}

interface TodoListState {
    showAdmin: boolean;
    show_back: string;
    showInfoDialog: boolean;
    showAddItemDialog: boolean;
    editingItem: TodoActivity | null;
    currentActivity: TodoActivity | null;
    currentItem : TodoItem | null; // 添加 currentItem 属性
    data: TodoActivity[];

}

class TodoList extends React.Component<{}, TodoListState> {
    state: TodoListState = {
        showAdmin: false,
        show_back: "none",
        showInfoDialog: false,
        showAddItemDialog: false,
        editingItem: null,
        currentActivity: null,
        currentItem: null,
        data: [],
    };

    // 添加一个新的状态用于存储搜索结果
    searchData: TodoActivity[] = [];

    columns: ProColumns<TodoActivity>[] = [
        {
            title: '活动名称',
            dataIndex: 'ActivityName',
            key: 'ActivityName',
        },
        {
            title: '开始时间',
            dataIndex: 'ActivityBeginTime',
            key: 'ActivityBeginTime',
            render: (_, record) => (
                `${record.ActivityBeginDate} ${record.ActivityBeginTime}`
            ),
        },
        {
            title: '结束时间',
            dataIndex: 'ActivityEndTime',
            key: 'ActivityEndTime',
            render: (_, record) => (
                `${record.ActivityEndDate} ${record.ActivityEndTime}`
            ),
        },
    ];
  
    admin_item: ProColumns<TodoActivity> = {
        title: '操作',
        render: (_, activity: TodoActivity) => (
            <span>
                <EditOutlined onClick={() => this.showUpdateDialog(activity)} />                {/* <Icon type="close" title="删除" style={{ color: '#ee6633', marginLeft: 12 }} onClick={() => this.deleteConfirm(activity)} /> */}
                <CloseOutlined 
                    title="删除" 
                    style={{ color: '#ee6633', marginLeft: 12 }} 
                    onClick={() => this.deleteConfirm(activity)} />
                <PlusOutlined
                        title="添加项目"
                        style={{ color: '#1890ff', marginLeft: 12 }}
                        onClick={() => this.addItem(activity)}
                    />
            </span>
        ),
    };

   

    //搜索功能
    handleSearch = (value: string) => {
        if (!value) {
            this.setState({ data: this.searchData });
            return;
        }
    
        // 将搜索值转换为小写以进行不区分大小写的匹配
        const searchValue = value.toLowerCase();
    
        const filteredData = this.searchData.filter(activity => {
            //检查活动名称是否包含搜索值（不区分大小写）
            const activityNameMatch = activity.ActivityName.toLowerCase().includes(searchValue);
    
            //检查活动事项是否包含搜索值（不区分大小写）
            const itemContentMatch = activity.items.some(item => item.ItemContent.toLowerCase().includes(searchValue));
    
            return activityNameMatch || itemContentMatch;
        });
    
        this.setState({ data: filteredData });
    };
    // handleSearch = (value: string) => {
    //     if (!value) {
    //         this.setState({ data: this.searchData });
    //         return;
    //     }
    //     const filteredData = this.searchData.filter(activity =>
    //         activity.ActivityName.includes(value) ||
    //         activity.items.some(item => item.ItemContent.includes(value))
    //     );
    //     this.setState({ data: filteredData });
    // };

    showAllData = () => {
        this.setState({ data: this.searchData });
    };

    componentDidMount() {
        this.getData();
    }

    getData = () => {
        HttpUtil.get(ApiUtil.API_Activity_LIST + localStorage.getItem('userID'))
            .then(async (response) => {
                const activityList = response as TodoActivity[];
                const activityListWithItems = await Promise.all(activityList.map(async (activity) => {
                    const items = await this.getItemsByActivity(activity.ActivityID);
                    return { ...activity, items };
                }));
                const activityListWithKeys = activityList.map((item, index) => ({
                                    ...item,
                                    key: item.UserID || index,
                                }));
                console.log("activityListWithItems", activityListWithItems);
                console.log("activityListWithKeys", activityListWithKeys);
                this.searchData = activityListWithItems; // 保存所有数据以供搜索使用
                this.setState({
                    data: activityListWithItems,
                    showInfoDialog: false,
                });
            })
            .catch(error => {
                message.error(error.message);
            });
    };

    getItemsByActivity = async (activityID: number) => {
        try {
            const response = await HttpUtil.get(`${ApiUtil.API_Item_LIST_BY_ACTIVITY}${activityID}`);
            return response as TodoItem[];
        } catch (error) {
            // message.error(error.message);
            return [];
        }
    };


    showUpdateDialog = (item?: TodoActivity) => {
        this.setState({
            showInfoDialog: true,
            editingItem: item || null,
        });
    };

    handleSave = (data: TodoActivity) => {
        this.getData();
    };

    deleteConfirm = (activity: TodoActivity) => {
        const that = this;  // 保存 this 的引用

        Modal.confirm({
            title: '确认',
            content: '确定要删除这条记录吗？',
            okText: '确认',
            cancelText: '取消',
            onOk() {
                that.removeData(activity.ActivityID);
            },
            onCancel() {},
        });
    };

    addItem = (activity: TodoActivity) => {
        this.setState({
            showAddItemDialog: true,
            currentActivity: activity,
        });
        console.log("addItemcurrentActivity:"+activity);
    };

    handleAddItem = (item: TodoItem) => {
        const { currentActivity, currentItem } = this.state;
        if (!currentActivity) {
            console.error("currentActivity is null");
            return;
        }
        //更新数据
        this.getData(); 
        this.setState({
            showAddItemDialog: false,
            currentActivity: null,
            currentItem: null,
        });
    };
       
    

    removeData = (id: number) => {
        HttpUtil.get(`${ApiUtil.API_Activity_DELETE}${id}`)
            .then(() => {
                message.success('删除成功');
                this.getData();
            })
            .catch(error => {
                message.error(error.message);
            });
    };

    // gotoAdmin = () => {
    //     this.setState({
    //         showAdmin: true,
    //         show_back: "block",
    //     });
    // };

    // onBack = () => {
    //     this.setState({
    //         showAdmin: false,
    //         show_back: "none",
    //     });
    // };


    renderItems = (items: TodoItem[]) => {
        console.log('Rendering items:', items);

        const itemColumns: ProColumns<TodoItem>[] = [
            {
                title: '事项内容',
                dataIndex: 'ItemContent',
                key: 'ItemContent',
            },
            {
                title: '事项等级',
                dataIndex: 'ItemLevel',
                key: 'ItemLevel',
            },
            {
                title: '操作',
                dataIndex: 'operation',
                valueType: 'option',
                render: (_, item: TodoItem) => (
                    console.log("renderitem:"+item.ActivityID),
                    <span>
                        <EditOutlined onClick={() => this.showUpdateItemDialog(item)} />
                        <CloseOutlined 
                            title="删除" 
                            style={{ color: '#ee6633', marginLeft: 12 }} 
                            onClick={() => this.deleteItemConfirm(item)} />
                    </span>
                ),
            },
        ];

        return (
            <ProTable<TodoItem>
                columns={itemColumns}
                dataSource={items}
                rowKey="ItemID"
                pagination={false}
                search={false}
                options={false}
                toolBarRender={false}
            />
        );
    };

    showUpdateItemDialog = (item: TodoItem) => {
        // 设置编辑状态的 item 和显示编辑对话框
        const currentActivity = this.state.data.find(activity => activity.ActivityID === item.ActivityID) || null;
        this.setState({
            showAddItemDialog: true,
            currentActivity,
            currentItem: item,
        });
        console.log("show:currentItem:"+this.state.currentItem?.ActivityID);
    };
    
    deleteItemConfirm = (item: TodoItem) => {
        Modal.confirm({
            title: '确认',
            content: '确定要删除这条记录吗？',
            okText: '确认',
            cancelText: '取消',
            onOk: () => this.deleteItem(item),
        });
    };
    
    deleteItem = (item: TodoItem) => {
        HttpUtil.delete(`${ApiUtil.API_Item_DELETE}${item.ItemID}`)
            .then(() => {
                message.success('删除成功');
                this.getData();
            })
            .catch(error => {
                message.error(error.message);
            });
    };
    

    render() {
        console.log('Data:', this.state.data);
        // const columns = this.state.showAdmin ? [...this.columns, this.admin_item] : this.columns;
        const columns = [...this.columns, this.admin_item]
        return (
            <Layout>
                <Content>

                    <div style={{ background: '#fff', padding: 24, minHeight: 480 }}>
                        <Search
                            placeholder="搜索活动或事项"
                            onSearch={this.handleSearch}
                            enterButton={<SearchOutlined />}
                            style={{ width: 200, marginRight: 16 }}
                        />
                        <Button onClick={this.showAllData}>
                            显示全部
                        </Button>
                        <Button style={{ position: "absolute", right: "70px", top: "20px",}} onClick={() => this.showUpdateDialog()}>
                            添加
                        </Button>

                        <InfoDialog
                            visible={this.state.showInfoDialog}
                            afterClose={() => this.setState({ showInfoDialog: false })}
                            onSave={this.handleSave}
                            editingItem={this.state.editingItem}
                        />
                        
                        <AddItemDialog
                            visible={this.state.showAddItemDialog}
                            onCancel={() => this.setState({ showAddItemDialog: false })}
                            onAdd={this.handleAddItem}
                            activityId={this.state.currentActivity?.ActivityID || 0}
                            ItemId = {this.state.currentItem?.ItemID || 0}
                            editingItem={this.state.currentItem || null}
                        />


                        <ProTable<TodoActivity>
                            columns={columns}
                            dataSource={this.state.data}
                            rowKey="key"
                            pagination={{ pageSize: 20 }}
                            scroll={{ y: 340 }}
                            search={false}
                            options={false}
                        />

                        <Collapse>
                            {this.state.data.map(activity => (
                                <Panel header={activity.ActivityName} key={activity.ActivityID}>
                                    <p>开始时间: {`${activity.ActivityBeginDate} ${activity.ActivityBeginTime}`}</p>
                                    <p>结束时间: {`${activity.ActivityEndDate} ${activity.ActivityEndTime}`}</p>
                                    {this.renderItems(activity.items)}
                                </Panel>
                            ))}
                        </Collapse>

                        

                        {/* <div style={{ position: "absolute", left: "10px", bottom: "10px" }}>
                            <a onClick={this.gotoAdmin}>管理员</a>
                        </div>
                        <div style={{ position: "absolute", left: "70px", bottom: "10px", display: this.state.show_back }}>
                            <a onClick={this.onBack}>返回</a>
                        </div> */}

                    </div>
                </Content>
            </Layout>
        );
    }
}

export default TodoList;
