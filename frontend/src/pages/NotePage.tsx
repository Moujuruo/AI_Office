import React, { useEffect, useState } from "react";
import {
  Layout,
  Button,
  message,
  Modal,
  Collapse,
  Input,
  theme,
  CollapseProps,
} from "antd";
import { ProTable, ProColumns } from "@ant-design/pro-components";
import {
  CaretRightOutlined,
  EditOutlined,
  CloseOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import InfoDialog from "./InfoDialog";
import AddItemDialog from "./AddItemDialog";
import HttpUtil from "../utils/HttpUtil";
import ApiUtil from "../utils/ApiUtil";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { ApiResponse } from "../utils/ApiUtil";
import '../css/editor.css'

const { Content } = Layout;
const { Panel } = Collapse;

type State = {
  title: string;
  content: string;
  success: string | null;
  userName: string | null;

  noteTitles: string[];
  noteContentCache: { [key: string]: string | void };
};

class NoteList extends React.Component<{}, State> {
  constructor(props: any) {
    super(props);
    this.saveInterval = undefined;
  }
  state: State = {
    title: "",
    content: "",
    success: null,
    userName: localStorage.getItem("username"),
    noteTitles: [],
    noteContentCache: {},
  };
  saveInterval: NodeJS.Timeout | undefined;

  componentDidMount() {
    this.saveInterval = setInterval(() => this.saveContent(), 60000);
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
          this.setState({ noteTitles: data.data });
        } else {
          message.error("获取笔记列表失败！");
        }
      }
    );
  };

  getNoteContent = (title: string): Promise<string> => {
    return HttpUtil.get(
      ApiUtil.API_NOTE_CONTENT + this.state.userName + "/" + title
    ).then(async (data: any) => {
      if (data.status === 200) {
        return data.data;
      } else {
        message.error("获取笔记内容失败！");
        return "";
      }
    });
  };

  saveContent = () => {
    if (
      !this.state.title.trim() ||
      !this.state.content.trim() ||
      !(this.state.noteTitles as string[]).includes(this.state.title)
    ) {
      return;
    }
    this.addContent(this.state, true);
  };

  handleEditBottonClick = (note_title: string, note_content: string) => {
    this.setState({
      title: note_title[0],
    });
    this.setState({
      content: note_content[0],
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

  render() {
    return (
      <Layout>
        <Content>
          <div>
            <div>
              <Input
                placeholder="请输入笔记名称"
                style={{ width: 200, marginRight: 10, marginBottom: 10 }}
                value={this.state.title}
                onChange={this.handleTitleChange}
              />
              <Button
                type="primary"
                className="bg-blue-300"
                onClick={() => this.addContent(this.state, false)}
              >
                保存
              </Button>
            </div>
            <div>
              <ReactQuill
                theme="snow"
                value={this.state.content || ""}
                onChange={this.handleContentChange}
                className="my-editor"
                style={{ height: 200, marginBottom: 10, }}
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
          </div>
        </Content>
        <div style={{ margin: "20px 0" }} />
        <Content>
          {this.state.noteTitles.map((title: string, index) => {
            return (
              <div>
                <Collapse
                  onChange={async () => {
                    const note_content = await this.getNoteContent(title);
                    this.setState((prevState) => ({
                      noteContentCache: {
                        ...prevState.noteContentCache,
                        [title]: note_content[0],
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
                        <span style={{ marginRight: "auto" }}>{title}</span>
                        <Button
                          ghost
                          type="primary"
                          style={{ marginLeft: 10 }}
                          onClick={async (event) => {
                            event.stopPropagation();
                            const note_content = await this.getNoteContent(
                              title
                            );
                            this.setState((prevState) => ({
                              noteContentCache: {
                                ...prevState.noteContentCache,
                                [title]: note_content[0],
                              },
                            }));
                            console.log(note_content);
                            this.handleEditBottonClick(title, note_content);
                          }}
                        >
                          编辑
                        </Button>
                        <Button
                          danger
                          style={{ marginLeft: 10 }}
                          onClick={(event) => {
                            event.stopPropagation();
                            this.deleteNote(title);
                          }}
                        >
                          删除
                        </Button>
                      </div>
                    }
                    key={index}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: this.state.noteContentCache[title] ?? "",
                      }}
                    />
                  </Panel>
                </Collapse>

                <div style={{ margin: "10px 0" }} />
              </div>
            );
          })}
        </Content>
      </Layout>
    );
  }
}

export default NoteList;
