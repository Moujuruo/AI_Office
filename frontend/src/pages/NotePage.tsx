import React from "react";
import {
  Layout,
  Button,
  message,
  Collapse,
  Input,
  Radio,
  ConfigProvider
} from "antd";
import {
  SaveOutlined
} from "@ant-design/icons"
import HttpUtil from "../utils/HttpUtil";
import ApiUtil from "../utils/ApiUtil";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { ApiResponse } from "../utils/ApiUtil";
import '../css/editor.css'
import { RadioChangeEvent } from "antd/lib";
import { TinyColor } from '@ctrl/tinycolor';
import dayjs from 'dayjs'
import QueueAnim from 'rc-queue-anim';

const { Content } = Layout;
const { Panel } = Collapse;

type State = {
  title: string;
  content: string;
  importance: string;
  savetime: string;
  success: string | null;
  userName: string | null;
  noteTitles: string[];
  noteImportances: string[];
  noteSaveTimes: string[];
  noteContentCache: { [key: string]: string };
};

class NoteList extends React.Component<{}, State> {
  constructor(props: any) {
    super(props);
    this.saveInterval = undefined;
  }
  state: State = {
    title: "",
    content: "",
    importance: "Normal",
    savetime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    success: null,
    userName: localStorage.getItem("username"),
    noteTitles: [],
    noteSaveTimes: [],
    noteImportances: [],
    noteContentCache: {},
  };
  saveInterval: NodeJS.Timeout | undefined;

  componentDidMount() {
    this.saveInterval = setInterval(() => this.autoSave(), 30000);
    this.getNoteTitles();
  }

  componentWillUnmount() {
    clearInterval(this.saveInterval);
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    const msg = message;
    if (prevState.success !== this.state.success) {
      if (this.state.success === "save") {
        msg.success("文档保存成功！");
        this.setState({ success: null }); // Reset success state
      } else if (this.state.success === "auto_save") {
        msg.success("自动保存成功！");
        this.setState({ success: null }); // Reset success state
      } else if (this.state.success === "save_failed") {
        msg.error("文档保存失败！");
        this.setState({ success: null }); // Reset success state
      }
    }
  }

  handleTitleChange = (e: any) => {
    this.setState({ title: e.target.value });
  };

  handleContentChange = (value: any) => {
    this.setState({ content: value });
  };

  handleImportanceChange = (e: RadioChangeEvent) => {
    this.setState({ importance: e.target.value });
  }

  addContent = async (state: any, auto: boolean) => {
    const msg = message;
    if (!state.title.trim()) {
      msg.error("标题不能为空！");
      return;
    } else if (!state.content.trim()) {
      msg.error("内容不能为空！");
      return;
    }
    try {
      this.state.savetime = dayjs().format('YYYY-MM-DD HH:mm:ss');
      const response = (await HttpUtil.post(
        ApiUtil.API_NOTE_UPDATE,
        state
      )) as ApiResponse<any>;
      if (response.status == 200) {
        if (auto) {
          this.setState({ success: "auto_save" });
        } else {
          this.setState({ success: "save" });
        }
        this.setState((prevState) => ({
          noteContentCache: {
            ...prevState.noteContentCache,
            [this.state.title]: this.state.content,
          },
        }));
      } else {
        this.setState({ success: "save_failed" });
      }
      this.getNoteTitles();
    } catch (error) {
      this.setState({ success: "save_failed" });
    }
  };

  getNoteTitles = () => {
    HttpUtil.get(ApiUtil.API_NOTE_LIST + this.state.userName).then(
      async (data: any) => {
        if (data.status === 200) {
          this.setState({ noteTitles: data.titles });
          this.setState({ noteImportances: data.importances });
          this.setState({ noteSaveTimes: data.save_times });
        } else {
          message.error("获取笔记列表失败！");
        }
      }
    );
  };

  getNoteContent = async (title: string): Promise<string> => {
  if (this.state.noteContentCache[title]) {
    return this.state.noteContentCache[title];
  }
  try {
    const data: any = await HttpUtil.get(
      ApiUtil.API_NOTE_CONTENT + this.state.userName + "/" + title
    );
    if (data.status === 200) {
      return data.data[0];
    } else {
      message.error("获取笔记内容失败！");
      return "";
    }
  } catch (error) {
    message.error("获取笔记内容失败！");
    return "";
  }
};

  autoSave = () => {
    if (
      !this.state.title.trim() ||
      !this.state.content.trim() ||
      !(this.state.noteTitles as string[]).includes(this.state.title)
    ) {
      return;
    }
    this.addContent(this.state, true);
  };

  handleEditBottonClick = (note_title: string, note_content: string, importance: string) => {
    console.log(note_content)
  
    this.setState({
      title: note_title,
      content: note_content,
      importance: importance
    });
  };

  deleteNote = (note_title: string) => {
    HttpUtil.get(
      ApiUtil.API_NOTE_DELETE + this.state.userName + "/" + note_title
    ).then(async (data: any) => {
      if (data.status === 200) {
        message.success("删除笔记成功！");
        this.getNoteTitles();
      } else {
        message.error("删除笔记失败！");
      }
    });
  }

  getColorByImportance = (importance: string) => {
    if (importance == "Normal") {
      return '#f0f5ff';
    } else if (importance == "Important") {
      return '#fff2e8';
    } else if (importance == "Crucial") {
      return '#fff1f0';
    }
  }

  render() {
    return (
      <Layout>
        <div
          style={{
            minHeight: 700,
            background: "#ffffff",
            borderRadius: 10,
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
            paddingBottom: 30,
          }}
        >
          <Content>
            <div
              style={{
                paddingTop: 20,
                paddingLeft: 20,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span style={{ fontSize: "Large", marginRight: 10 }}>📜 </span>
                <Input
                  placeholder="请输入笔记名称"
                  style={{ width: 200, marginRight: 10, marginBottom: 10 }}
                  value={this.state.title}
                  onChange={this.handleTitleChange}
                />

                <Radio.Group
                  value={this.state.importance}
                  onChange={this.handleImportanceChange}
                  defaultValue={"Normal"}
                  // buttonStyle="solid"
                >
                  <ConfigProvider
                    theme={{
                      components: {
                        Radio: {},
                      },
                    }}
                  >
                    <Radio.Button value="Normal">普通</Radio.Button>
                  </ConfigProvider>
                  <ConfigProvider
                    theme={{
                      components: {
                        Radio: {
                          buttonSolidCheckedBg: "#ff6f00",
                          buttonSolidCheckedHoverBg: "#ff6f00",
                          buttonSolidCheckedActiveBg: "#ff6f00",
                          colorPrimary: "#ff6f00",
                          colorPrimaryHover: "#ff6f00",
                          colorPrimaryActive: "#ff6f00",
                          colorPrimaryBorder: "#ff6f00",
                        },
                      },
                    }}
                  >
                    <Radio.Button value="Important">重要</Radio.Button>
                  </ConfigProvider>
                  <ConfigProvider
                    theme={{
                      components: {
                        Radio: {
                          buttonSolidCheckedBg: "#ff4d4f",
                          buttonSolidCheckedHoverBg: "#ff4d4f",
                          buttonSolidCheckedActiveBg: "#ff4d4f",
                          colorPrimary: "#ff4d4f",
                          colorPrimaryHover: "#ff4d4f",
                          colorPrimaryActive: "#ff4d4f",
                          colorPrimaryBorder: "#ff4d4f",
                        },
                      },
                    }}
                  >
                    <Radio.Button value="Crucial">关键</Radio.Button>
                  </ConfigProvider>
                </Radio.Group>
                <Button
                  type="primary"
                  style={{ marginLeft: 20 }}
                  onClick={() => this.addContent(this.state, false)}
                  icon={<SaveOutlined />}
                  iconPosition="start"
                >
                  保存
                </Button>
              </div>
              <div
                style={{
                  color: "#aaa",
                  marginRight: 50,
                  paddingTop: 6,
                }}
              >
                上次修改: {this.state.savetime}
              </div>
            </div>
            <div style={{ paddingLeft: 20, paddingRight: 20 }}>
              <ReactQuill
                theme="snow"
                value={this.state.content || ""}
                onChange={this.handleContentChange}
                className="my-editor"
                style={{ marginBottom: 20 }}
                modules={{
                  toolbar: [
                    ["bold", "italic", "underline", "strike"], // toggled buttons
                    ["blockquote", "code-block"],

                    [{ header: 1 }, { header: 2 }], // custom button values
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ script: "sub" }, { script: "super" }], // superscript/subscript
                    [{ indent: "-1" }, { indent: "+1" }], // outdent/indent

                    [{ header: [1, 2, 3, 4, 5, 6, false] }],

                    [{ color: [] }, { background: [] }], // dropdown with defaults from theme
                    [{ font: [] }],
                    [{ align: [] }],

                    ["clean"], // remove formatting button

                    ["link", "image", "video"], // link and image, video
                  ],
                }}
              />
            </div>
          </Content>
          <div style={{ margin: "20px 0" }} />
          <Content>
            <div style={{ marginLeft: 20, marginRight: 20, marginTop: 30 }}>
              <QueueAnim delay={300} type='top'>
                {this.state.noteTitles.map((title: string, index) => {
                  const importance = this.state.noteImportances[index];
                  const importance_color =
                    this.getColorByImportance(importance);
                  return (
                    <div key={index}>
                      <ConfigProvider
                        theme={{
                          token: {},
                          components: {
                            Collapse: {
                              colorBorder: importance_color,
                              headerBg: importance_color,
                            },
                          },
                        }}
                      >
                        <Collapse
                          onChange={async () => {
                            const note_content: string =
                              await this.getNoteContent(title);
                            this.setState((prevState) => ({
                              noteContentCache: {
                                ...prevState.noteContentCache,
                                [title]: note_content,
                              },
                            }));
                          }}
                        >
                          <Panel
                            header={
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                }}
                              >
                                <span
                                  style={{ fontSize: "Large", marginRight: 10 }}
                                >
                                  🏷️{" "}
                                </span>
                                <span
                                  style={{
                                    fontWeight: "bold",
                                    marginRight: "auto",
                                    paddingTop: 4,
                                  }}
                                >
                                  {title}
                                </span>
                                <ConfigProvider
                                  theme={{
                                    components: {
                                      Button: {
                                        defaultBg: "#ffffff",
                                        defaultHoverBg: "#1677FF",
                                        defaultColor: "#2f54eb",
                                        defaultHoverColor: "#ffffff",
                                        lineWidth: 0,
                                      },
                                    },
                                  }}
                                >
                                  <div
                                    style={{
                                      marginRight: 20,
                                      paddingTop: 6,
                                      color: "#aaa",
                                    }}
                                  >
                                    上次修改: {this.state.noteSaveTimes[index]}
                                  </div>
                                  <Button
                                    type="default"
                                    style={{ marginLeft: 10 }}
                                    onClick={async (event) => {
                                      event.stopPropagation();
                                      const note_content: string =
                                        await this.getNoteContent(title);
                                      this.setState((prevState) => ({
                                        noteContentCache: {
                                          ...prevState.noteContentCache,
                                          [title]: note_content,
                                        },
                                      }));
                                      this.handleEditBottonClick(
                                        title,
                                        note_content,
                                        importance
                                      );
                                    }}
                                  >
                                    编辑
                                  </Button>
                                </ConfigProvider>
                                <ConfigProvider
                                  theme={{
                                    components: {
                                      Button: {
                                        defaultBg: "#ffffff",
                                        defaultColor: "#f5222d",
                                        defaultHoverBg: "#ff4d4f",
                                        defaultHoverColor: "#ffffff",
                                        lineWidth: 0,
                                      },
                                    },
                                  }}
                                >
                                  <Button
                                    type="default"
                                    style={{ marginLeft: 10 }}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      this.deleteNote(title);
                                    }}
                                  >
                                    删除
                                  </Button>
                                </ConfigProvider>
                              </div>
                            }
                            key={index}
                          >
                            <div
                              dangerouslySetInnerHTML={{
                                __html:
                                  this.state.noteContentCache[title] ?? "",
                              }}
                            />
                          </Panel>
                        </Collapse>

                        <div style={{ margin: "10px 0" }} />
                      </ConfigProvider>
                    </div>
                  );
                })}
              </QueueAnim>
            </div>
          </Content>
        </div>
      </Layout>
    );
  }
}

export default NoteList;
