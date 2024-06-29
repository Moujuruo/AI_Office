智能办公
===
## 环境配置

sqlite：https://www.runoob.com/sqlite/sqlite-installation.html

flask：`pip install flask` 或 `pip install -r requirements.txt`

react：先配置nodejs

python 推荐使用虚拟环境，我使用的是 3.8 版本

## 启动

1. 在安装好flask的环境下不要进入`backend`目录启动后端：`python backend/run.py` 
2. 进入`frontend`目录启动前端：`npm start` （第一次启动需要先`npm install`）

## 前端部分

使用 antdesign 作为 UI 框架，文档见https://ant.design/

为了简化设计，使用了基于 antdesign 的 ProComponents，文档见https://procomponents.ant.design/ 也推荐大量使用 ProComponents，既好看写起来又简单

代码结构是：

- src
  - css
    - editor.css：笔记编辑器的样式
  - App.tsx: 基本的路由配置
  - pages
    - MainLayout.tsx: 主要的布局文件，包含了侧边栏和头部，切换的路由管理也要记得加在这里
    - Login
      - Login.tsx: 登录页面
      - Register.tsx: 注册页面
    - HomePage 主页
      - HomePage.tsx: 主页
      - LeftTopSection.tsx: 主页左上块
      - RightTopSection.tsx: 主页右上块
    - NotePage.tsx: 笔记页面
    - TodoList.tsx: 日程表功能
    - InfoDialog.tsx: 插入日程表的弹窗
    - Reservation
      - MyReservation.tsx: 我的预约
      - ReservationModal.tsx: 预约弹窗
      - ReservationPage.tsx: 预约页面
      - RoomInfoToolTips.tsx: 房间信息提示
    - Team 团队页面（todo：只实现了基本功能）
  - router
    - ProtectedRoute.tsx: 保护路由，未登录时跳转到登录页面
  - utils
    - ApiUtil.ts: API调用的地址，新增在这里
    - HttpUtil.ts: 封装了 POST 和 GET 方法

加新页面最好在 pages 下新建文件夹，然后在 MainLayout.tsx 中加入路由

## 后端部分

flask 后端框架，todo：需要重构部分代码，目前较冗余
`run_app.py`为启动文件，其余均为模块文件

## 数据库

使用 sqlite 数据库，建库脚本见后端各模块。测试用的数据库为 `Ai_work.db`


## 部署


### 后端部分

更新 `run_app.py` 以提供静态文件服务
```python
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists("frontend/build/" + path):
        return send_from_directory('frontend/build', path)
    else:
        return send_from_directory('frontend/build', 'index.html')
```

开头要改为相对导入
```python
from . import SqliteUtil as DBUtil
from . import sqlite_roombooking as RBooking
from . import sqlite_note as RNote
from . import sqlite_team as Team
# 其他导入...
```

更新路由使用绝对路径:
```python
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    # 使用绝对路径指向uploads目录
    return send_from_directory(os.path.abspath('../uploads'), filename)

@app.route('/assets/<filename>')
def assets_file(filename):
    # 使用绝对路径指向assets目录
    return send_from_directory(os.path.abspath('../assets'), filename)
```

修改 Flask 入口为：
```python
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
```

传输到服务器:
```bash
scp -r <your-local-flask-project-dir> <your-username>@<your-server-ip>:<path-to-your-app>
```

服务器安装好相关依赖，以及 `gunicorn`:
```bash
pip install gunicorn
```

项目根目录下放置 `wsgi.py`:
```python
from backend.run_app import app

if __name__ == "__main__":
    app.run()
```

现在的项目结构为:
```
AI_Office/
├── backend/
│   ├── run_app.py
│   ├── SqliteUtil.py
│   ├── ...
├── frontend/
├── wsgi.py
```

### 前端部分

本地构建 React 静态文件
```bash
npm install
npm run build
```

将生成的 build 上传至服务器
```bash
scp -r build <your-username>@<your-server-ip>:<path-to-your-app>/frontend
```

服务器安装 Nginx:
```bash
sudo apt update
sudo apt install nginx
```
```bash
sudo vim /etc/nginx/sites-available/AI_Office
```


```
server {
    listen 80;
    server_name 47.92.112.75;  # 使用公网IP

    # 配置前端静态文件路径
    location / {
        # React 项目的构建路径
        root /home/moujuruo/AI_Office/front_end/build;
        try_files $uri /index.html;
    }

    # 配置 API 端点的反向代理
    location /api {
        include proxy_params;
        proxy_pass http://localhost:5001;  # 这里假设你的 Flask app 运行在端口5001
    }

        # Add configurations for uploads and assets
    location /assets/ {
        alias /home/moujuruo/AI_Office/assets/;
    }

    location /static/ {
        alias /home/moujuruo/AI_Office/frontend/build/static/;
        expires max;
        access_log off;
    }

    location /uploads/ {
        alias /home/moujuruo/AI_Office/uploads/;
    }

    error_page 404 /index.html;
    location = /index.html {
        root /home/moujuruo/AI_Office/frontend/build;
        internal;
    }

    client_max_body_size 50M;  # 允许较大的文件上传，如果需要可以调整
}
```

```bash
sudo ln -s /etc/nginx/sites-available/AI_Office /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 启动

在项目根目录下：
```bash
gunicorn --workers 3 --bind 0.0.0.0:5001 wsgi:app
```
若要后台运行，为：
```bash
nohup gunicorn --workers 3 --bind 0.0.0.0:5001 wsgi:app &
```

