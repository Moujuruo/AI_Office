智能办公
===
## 环境配置

sqlite：https://www.runoob.com/sqlite/sqlite-installation.html

flask：`pip install flask` 或 `pip install -r requirements.txt`

react：先配置nodejs

python 推荐使用虚拟环境，我使用的是 3.8 版本

## 启动

1. 在安装好flask的环境下进入`backend`目录启动后端：`python run.py` 
2. 进入`frontend`目录启动前端：`npm start` （第一次启动需要先`npm install`）

## 前端部分

使用 antdesign 作为 UI 框架，文档见https://ant.design/

为了简化设计，使用了基于 antdesign 的 ProComponents，文档见https://procomponents.ant.design/ 也推荐大量使用 ProComponents，既好看写起来又简单

代码结构是：

- src
  - App.tsx: 基本的路由配置
  - pages
    - MainLayout.tsx: 主要的布局文件，包含了侧边栏和头部，切换的路由管理也要记得加在这里
    - Login.tsx: 登录页面
    - HomePage.tsx: 主页
    - TodoList.tsx: 日程表功能
    - InfoDialog.tsx: 插入日程表的弹窗，应该和上一个文件放在一个文件夹下(todo)，还没用 ProComponents 重写
  - router
    - ProtectedRoute.tsx: 保护路由，未登录时跳转到登录页面
  - utils
    - ApiUtil.ts: API调用的地址，新增在这里
    - HttpUtil.ts: 封装了 POST 和 GET 方法

加新页面最好在 pages 下新建文件夹，然后在 MainLayout.tsx 中加入路由

## 后端部分

flask 后端框架，较为简单，就两个文件看看就懂了