import React from 'react';
import { Layout, Button, message, Modal, Collapse, Input } from 'antd';
import { ProTable, ProColumns } from '@ant-design/pro-components';
import {EditOutlined, CloseOutlined, PlusOutlined} from '@ant-design/icons';
import InfoDialog from './InfoDialog';
import AddItemDialog from './AddItemDialog';
import HttpUtil from '../utils/HttpUtil';
import ApiUtil from '../utils/ApiUtil';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../css/NotePage.css'


const { Content } = Layout;
const { Panel } = Collapse;

class NoteList extends React.Component {
    state = {
        title: '',
        content: ''
    };

    handleTitleChange = (e: any) => {
        this.setState({ title: e.target.value });
    }

    handleContentChange = (value: any) => {
        this.setState({ content: value });
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
                  <Button>添加</Button>
                </div>
                <div>
                  <ReactQuill
                    theme="snow"
                    value={this.state.content}
                    onChange={this.handleContentChange}
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
          </Layout>
        );
    }
}

export default NoteList;
