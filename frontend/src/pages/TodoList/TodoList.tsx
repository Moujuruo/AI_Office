import React from 'react';
import { Layout, Button, Input, message, Modal, Collapse, Badge, ConfigProvider, Tag, Segmented, Drawer } from 'antd';
import { ProTable, ProColumns } from '@ant-design/pro-components';
import { EditOutlined, CloseOutlined, PlusOutlined, SearchOutlined, AppstoreAddOutlined } from '@ant-design/icons';
import InfoDialog from '../InfoDialog';
import AddItemDialog from './AddItemDialog';
import HttpUtil from '../../utils/HttpUtil';
import ApiUtil from '../../utils/ApiUtil';
import QueueAnim from 'rc-queue-anim';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Panel } = Collapse;
const { Search } = Input;


export interface TodoItem {
  ItemID: number;       // 事项ID，整数类型
  ActivityID: number;   // 活动ID，整数类型，关联到活动表中的活动ID
  UserID: number;       // 用户ID，整数类型，关联到用户表中的用户ID
  ItemContent: string;  // 事项内容，字符串类型
  ItemLevel: string;    // 事项等级，字符串类型，可选值为：重要且紧急、重要但不紧急、不重要且紧急、不重要且不紧急
  ItemStatus: string;   // 事项状态, 字符串类型，可选值为：未开始、进行中、已完成
  ongoing_time: string; // 进行中时间，字符串类型
  finish_time: string;
}


export interface TodoActivity {
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
  currentItem: TodoItem | null; // 添加 currentItem 属性
  data: TodoActivity[];
  activityStatus: string;
  drawerVisible: boolean;
  drawerActivity: TodoActivity | null;
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
    activityStatus: 'ongoing',
    drawerVisible: false,
    drawerActivity: null,
  };

  // 添加一个新的状态用于存储搜索结果
  searchData: TodoActivity[] = [];

  showDrawer = (activity: TodoActivity) => {
    this.setState({
      drawerVisible: true,
      drawerActivity: activity,
    });
  };

  closeDrawer = () => {
    this.setState({
      drawerVisible: false,
    });
  };

  columns: ProColumns<TodoActivity>[] = [
    {
      title: '活动名称',
      dataIndex: 'ActivityName',
      key: 'ActivityName',
      render: (_, record) => {
        const now_time = dayjs().format('YYYY-MM-DD HH:mm:ss');
        // 设置 status 的值
        let status: any = 'default';
        if (record.ActivityBeginDate + ' ' + record.ActivityBeginTime < now_time) {
          status = 'processing';
        }
        if (record.ActivityEndDate + ' ' + record.ActivityEndTime < now_time) {
          status = 'success';
        }
        if (record.ActivityBeginDate + ' ' + record.ActivityBeginTime > now_time && record.ActivityEndDate + ' ' + record.ActivityEndTime > now_time) {
          status = 'warning';
        }

        return (
          <span onClick={() => this.showDrawer(record)}>
            <Badge status={status} text={record.ActivityName} />
          </span>
        );
      }
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
        <EditOutlined onClick={() => this.showUpdateDialog(activity)} />
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
      this.filterActivities();
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

  componentDidMount() {
    this.getData();
  }

  getData = () => {
    HttpUtil.get(ApiUtil.API_Activity_LIST + localStorage.getItem("userID"))
      .then(async (response) => {
        const activityList = response as TodoActivity[];
        const activityListWithItems = await Promise.all(
          activityList.map(async (activity) => {
            const items = await this.getItemsByActivity(
              activity.ActivityID
            );
            return { ...activity, items };
          })
        );
        this.searchData = activityListWithItems; // 保存所有数据以供搜索使用
        // 如果有打开的 Drawer，找到对应的 Activity 并更新其 items
        if (this.state.drawerVisible && this.state.drawerActivity) {
          const updatedDrawerActivity = activityListWithItems.find(
            (activity) => activity.ActivityID === this.state.drawerActivity?.ActivityID
          );
          this.setState({
            data: activityListWithItems,
            showInfoDialog: false,
            drawerActivity: updatedDrawerActivity || null,
          }, () => {
            this.filterActivities();
          });
        } else {
          this.setState({
            data: activityListWithItems,
            showInfoDialog: false,
          }, () => {
            this.filterActivities();
          });
        }
      })
      .catch((error) => {
        message.error(error.message);
      });
  };

  getItemsByActivity = async (activityID: number) => {
    try {
      const response = await HttpUtil.get(`${ApiUtil.API_Item_LIST_BY_ACTIVITY}${activityID}`);
      console.log("getItemsByActivity:" + response);
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
      onCancel() { },
    });
  };

  addItem = (activity: TodoActivity) => {
    this.setState({
      showAddItemDialog: true,
      currentActivity: activity,
    });
    console.log("addItemcurrentActivity:" + activity);
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
      // currentActivity: null,
      // currentItem: null, 
      activityStatus: this.state.activityStatus,

    });

  };

  removeData = (id: number) => {
    HttpUtil.delete(`${ApiUtil.API_Activity_DELETE}${id}`)
      .then(() => {
        message.success('删除成功');
        this.getData();
      })
      .catch(error => {
        message.error(error.message);
      });
  };

  handleActivityStatusChange = (value: string) => {
    this.setState({ activityStatus: value }, () => {
      this.filterActivities();
    });
  };

  // 添加一个新的方法用于根据活动状态筛选数据
  filterActivities = () => {
    console.log('Filtering activities:', this.state.activityStatus);
    const { activityStatus } = this.state;
    const now = dayjs();

    let filteredData: TodoActivity[] = [];

    if (activityStatus === 'all') {
      filteredData = this.searchData;
    } else if (activityStatus === 'ongoing') {
      filteredData = this.searchData.filter(activity => {
        const startTime = dayjs(`${activity.ActivityBeginDate} ${activity.ActivityBeginTime}`);
        const endTime = dayjs(`${activity.ActivityEndDate} ${activity.ActivityEndTime}`);
        return now.isAfter(startTime) && now.isBefore(endTime);
      });
    } else if (activityStatus === 'completed') {
      filteredData = this.searchData.filter(activity => {
        const endTime = dayjs(`${activity.ActivityEndDate} ${activity.ActivityEndTime}`);
        return now.isAfter(endTime);
      });
    } else if (activityStatus === 'notStarted') {
      filteredData = this.searchData.filter(activity => {
        const startTime = dayjs(`${activity.ActivityBeginDate} ${activity.ActivityBeginTime}`);
        return now.isBefore(startTime);
      });
    }

    this.setState({ data: filteredData });
  };



  renderItems = (items: TodoItem[]) => {
    console.log('Rendering items:', items);

    const itemColumns: ProColumns<TodoItem>[] = [
      {
        dataIndex: 'index',
        valueType: 'indexBorder',
        width: 48,
      },
      {
        title: '事项内容',
        dataIndex: 'ItemContent',
        key: 'ItemContent',
      },
      {
        title: '事项等级',
        dataIndex: 'ItemLevel',
        key: 'ItemLevel',
        // 渲染成 tag
        render: (_, item) => {
          let color = 'default';
          if (item.ItemLevel === "重要且紧急") {
            color = 'red';
          } else if (item.ItemLevel === "重要但不紧急") {
            color = 'orange';
          } else if (item.ItemLevel === "不重要且紧急") {
            color = 'green';
          }
          else if (item.ItemLevel === "不重要且不紧急") {
            color = 'blue';
          }
          return (
            <span>
              <Tag color={color}>
                {item.ItemLevel}
              </Tag>
            </span>
          );
        },
      },
      {
        title: '事项状态',
        dataIndex: 'ItemStatus',
        key: 'ItemStatus',
        filters: [
          { text: '未开始', value: '未开始' },
          { text: '进行中', value: '进行中' },
          { text: '已完成', value: '已完成' },
        ],
        onFilter: (value, record) => record.ItemStatus === value,
        render: (_, item) => {
          let badgeStatus: any = 'default';
          let badgeText = '未开始';
          if (item.ItemStatus === '进行中') {
            badgeStatus = 'processing';
            badgeText = '进行中';
          } else if (item.ItemStatus === '已完成') {
            badgeStatus = 'success';
            badgeText = '已完成';
          }
          return <Badge status={badgeStatus} text={badgeText} />;
        },
      },
      {
        title: '操作',
        dataIndex: 'operation',
        valueType: 'option',
        render: (_, item: TodoItem) => (
          console.log("renderitem:" + item.ActivityID),
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
    console.log("show:currentItem:" + this.state.currentItem?.ActivityID);
  };

  deleteItemConfirm = (item: TodoItem) => {
    Modal.confirm({
      title: '确认',
      content: '确定要删除这条记录吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => this.deleteItem(item),
    });
    console.log(this.state);
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
    // const { activityStatus } = this.state;
    const { activityStatus, drawerVisible, drawerActivity } = this.state;

    console.log('Data:', this.state.data);
    const columns = [...this.columns, this.admin_item]
    return (
      <Layout>
        <Content>
          <div
            style={{
              minHeight: 700,
              background: "#ffffff",
              borderRadius: 10,
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              paddingBottom: 30,
            }}
          >
            <div
              style={{
                paddingTop: 20,
                marginLeft: 20,
                display: "flex",
                justifyContent: "space-between",
              }}
              key="demo1"
            >
              <div>
                <Search
                  placeholder="搜索活动或事项"
                  onSearch={this.handleSearch}
                  enterButton={<SearchOutlined />}
                  style={{ width: 200, marginRight: 16 }}
                />
                <Segmented
                  options={[
                    { label: '全部', value: 'all' },
                    { label: '进行中', value: 'ongoing' },
                    { label: '已完成', value: 'completed' },
                    { label: '未开始', value: 'notStarted' }
                  ]}
                  value={activityStatus}
                  onChange={this.handleActivityStatusChange}
                />
              </div>
              <div>
                <Button
                  type="primary"
                  style={{ marginRight: 40 }}
                  onClick={() => this.showUpdateDialog()}
                  icon={<AppstoreAddOutlined />}
                >
                  添加
                </Button>
              </div>
            </div>

            <InfoDialog
              visible={this.state.showInfoDialog}
              afterClose={() => this.setState({ showInfoDialog: false })}
              onSave={this.handleSave}
              editingItem={this.state.editingItem}
            />

            <AddItemDialog
              visible={this.state.showAddItemDialog}
              // onCancel={() => this.setState({ showAddItemDialog: false })}
              onCancel={() => this.setState({ showAddItemDialog: false, currentActivity: null, currentItem: null })}
              onAdd={this.handleAddItem}
              activityId={this.state.currentActivity?.ActivityID || 0}
              ItemId={this.state.currentItem?.ItemID || 0}
              editingItem={this.state.currentItem || null}
            />
            <div style={{ margin: "20px 0" }} key="demo2" />
            <div key="demo3">
              <ProTable<TodoActivity>
                columns={columns}
                dataSource={this.state.data}
                style={{ padding: 0 }}
                rowKey="key"
                pagination={{ pageSize: 20 }}
                //   scroll={{ y: 340 }}
                search={false}
                options={false}
              />
            </div>

            <div style={{ marginLeft: 20, marginRight: 20 }} key="demo5">
              <QueueAnim delay={200} type="top">
                {this.state.data.map((activity, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: 10,
                    }}
                  >
                    <ConfigProvider
                      theme={{
                        token: {},
                        components: {
                          Collapse: {
                            colorBorder: "#f0f5ff",
                            headerBg: "#f0f5ff",
                          },
                        },
                      }}
                    >
                      <Collapse>
                        <Panel
                          header={
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "flex-start",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 'Large',
                                  marginRight: 10
                                }}
                              >
                                📜
                              </div>
                              <div
                                style={{
                                  fontWeight: "bold",
                                }}
                              >{activity.ActivityName}</div>
                            </div>
                          }
                          key={activity.ActivityID}
                        >
                          <p>
                            开始时间:{" "}
                            {`${activity.ActivityBeginDate} ${activity.ActivityBeginTime}`}
                          </p>
                          <p>
                            结束时间:{" "}
                            {`${activity.ActivityEndDate} ${activity.ActivityEndTime}`}
                          </p>
                          {this.renderItems(activity.items)}
                        </Panel>
                      </Collapse>
                    </ConfigProvider>
                  </div>
                ))}
              </QueueAnim>
            </div>
          </div>
        </Content>
        <Drawer
          title={drawerActivity?.ActivityName}
          placement="bottom"
          height={500}
          onClose={this.closeDrawer}
          open={drawerVisible}
        >
          <p>
            开始时间:{" "}
            {`${drawerActivity?.ActivityBeginDate} ${drawerActivity?.ActivityBeginTime}`}
          </p>
          <p>
            结束时间:{" "}
            {`${drawerActivity?.ActivityEndDate} ${drawerActivity?.ActivityEndTime}`}
          </p>
          {drawerActivity && this.renderItems(drawerActivity.items)}
        </Drawer>
      </Layout>
    );
  }
}

export default TodoList;
