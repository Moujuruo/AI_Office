# encoding: utf-8
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import SqliteUtil as DBUtil
import sqlite_roombooking as RBooking
from werkzeug.utils import secure_filename
import os
import llm_interface as LLM
from arrow import Arrow

app = Flask(__name__, template_folder='../front-end', static_folder='../front-end')
app.config['UPLOAD_FOLDER'] = './uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
CORS(app)  # 启用CORS


@app.route('/hi')
def hi():
    return 'hi~'

# api接口前缀
apiPrefix = '/api/v1/'


##################  Login接口  ##################
@app.route(apiPrefix + 'login', methods=['POST'])
def login():
    # 输出当前路径
    data = request.json
    username = data.get('username')
    password = data.get('password')
    # print(os.getcwd())
    result = DBUtil.get_user_password(username)
    id = DBUtil.get_user_ID(username)["id"]
    avatar = DBUtil.get_user_avatar(username)["avatar"]
    print(id)
    if result["status"] == 200 and result["password"] == password:
        # return jsonify({"token": "dummy-token", "status": 200})
        return jsonify({"userID": id, "status": 200, "avatar": avatar}), 200
    elif result["status"] == 404:
        return jsonify({"message": "用户不存在"}), 404
    else:
        return jsonify({"message": "密码错误"}), 401

################## Register接口 ##################
@app.route(apiPrefix + 'register', methods=['POST'])
def register():
    # password = data.get('password')
    data = request.json
    username = data.get('username')
    # password = data.get('password')
    pswd = data.get('password')
    gender = data.get('gender')

    result = DBUtil.insert_user(username, pswd, gender)
    return jsonify(result), result["status"]
    
############## Status接口 ##############
@app.route(apiPrefix + 'changeUserStatus', methods=['POST'])
def changeUserStatus():
    data = request.json
    print(data)
    userID = data.get('userID')
    status = data.get('status')
    result = DBUtil.change_user_status(userID, status)
    return jsonify(result), result["status"]

##################  Staff接口  ##################

@app.route(apiPrefix + 'updateStaff', methods=['POST'])
def updateStaff():
    try:
        data = request.get_json()  # 使用get_json()获取JSON数据
        print("data:"+data)
        result = DBUtil.insertStaff(json.dumps(data))
        if result == '新增成功' or result == '修改成功':
            re = {
                'code': 0,
                'message': result
            }
        else:
            re = {
                'code': 1,
                'message': result
            }
        return json.dumps(re)
    except Exception as e:
        return json.dumps({'code': 1, 'message': str(e)}), 500
    
@app.route(apiPrefix + 'getStaffList/<int:job>')
def getStaffList(job):
    array = DBUtil.getStaffs()
    jsonStaffs = DBUtil.getStaffsFromData(array)
    return json.dumps(jsonStaffs)

################## Avatar接口 ##################
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route(apiPrefix + 'uploadAvatar', methods=['POST'])
def uploadAvatar():
    print(request.files)
    if 'file' not in request.files:
        return jsonify({'status': 'fail', 'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'status': 'fail', 'message': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename).replace("\\", "/")  # 替换为正斜杠
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

        file.save(file_path)
        
        user_id = request.form['userID']
        DBUtil.update_user_avatar(user_id, file_path)
        
        return jsonify({'status': 200, 'message': 'File uploaded successfully', 'file_path': file_path}), 200
    else:
        return jsonify({'status': 'fail', 'message': 'Invalid file type'}), 400

    
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory("../uploads", filename)

##################  TodoActivity接口  ##################
@app.route(apiPrefix + 'updateActivity', methods=['POST'])
def insertActivity():
    try:
        data = request.get_json()  # 使用get_json()获取JSON数据
        result = DBUtil.updateActivity(json.dumps(data))
        if result == '新增成功' or result == '修改成功':
            re = {
                'code': 0,
                'message': result
            }
        else:
            re = {
                'code': 1,
                'message': result
            }
        return json.dumps(re)
    except Exception as e:
        return json.dumps({'code': 1, 'message': str(e)}), 500

@app.route(apiPrefix + 'getActivityList/<int:job>')
def getActivityList(job):
    try:
        array = DBUtil.getActivities(job)
        jsonActivities = DBUtil.getActivitiesFromData(array)
        return json.dumps(jsonActivities)
    except Exception as e:
        return json.dumps({'code': 1, 'message': str(e)}), 500

@app.route(apiPrefix + 'deleteActivity/<int:id>')
def deleteActivity(id):
    try:
        result = DBUtil.deleteActivity(id)
        if result == '删除成功':
            re = {
                'code': 0,
                'message': result
            }
        else:
            re = {
                'code': 1,
                'message': result
            }
        return json.dumps(re)
    except Exception as e:
        return json.dumps({'code': 1, 'message': str(e)}), 500



##################  Item接口  ##################
@app.route(apiPrefix + 'updateItem', methods=['POST'])
def addOrUpdateItem():
    try:
        data = request.get_json()
        result = DBUtil.insertOrUpdateTodoItem(json.dumps(data))
        print(result)
        if result == '新增成功' or result == '修改成功':
            re = {
                'code': 0,
                'message': result
            }
        else:
            re = {
                'code': 1,
                'message': result
            }
        return json.dumps(re)
    except Exception as e:
        return json.dumps({'code': 1, 'message': str(e)}), 500

@app.route(apiPrefix + 'deleteItem/<int:id>', methods=['DELETE'])
def deleteItem(id):
    try:
        result = DBUtil.deleteTodoItem(id)
        print(result)
        if result == '删除成功':
            re = {
                'code': 0,
                'message': result
            }
        else:
            re = {
                'code': 1,
                'message': result
            }
        return json.dumps(re)
    except Exception as e:
        return json.dumps({'code': 1, 'message': str(e)}), 500

@app.route(apiPrefix + 'getItems', methods=['GET'])
def getItems():
    try:
        array = DBUtil.getTodoItems()
        jsonItems = DBUtil.getTodoItemsFromData(array)
        return json.dumps(jsonItems)
    except Exception as e:
        return json.dumps({'code': 1, 'message': str(e)}), 500

@app.route(apiPrefix + 'getItemListByActivity/<int:activity_id>', methods=['GET'])
def getItemsByActivity(activity_id):
    try:
        items = DBUtil.getTodoItemsByActivity(activity_id)
        jsonItems = DBUtil.getTodoItemsFromData(items)
        return json.dumps(jsonItems)
    except Exception as e:
        return json.dumps({'code': 1, 'message': str(e)}), 500
    
########## meeting_room 接口 ##########
@app.route(apiPrefix + 'getAllRooms', methods=['POST'])
def getAllRooms():
    rooms = RBooking.getallrooms()
    if rooms is None:
        return jsonify({'code': 1, 'message': '获取会议室列表失败', 'status': 500 }), 500

    keys = ['id', 'name', 'floor', 'capacity', 'equipment']
    rooms_list = [dict(zip(keys, room)) for room in rooms]

    return jsonify({'code': 0, 'message': '获取会议室列表成功', 'status': 200, 'data': rooms_list}), 200

@app.route(apiPrefix + 'getAllReservations', methods=['POST'])
def getAllReservations():
    data = request.get_json()
    print(data)
    
    date = data.get('date')
    reservations = RBooking.getallreservations(date)
    if reservations is None:
        return jsonify({'code': 1, 'message': '获取预约列表失败', 'status': 500 })

    keys = ['id', 'room_id', 'user_id', 'start_time', 'end_time', 'date']
    reservations_list = [dict(zip(keys, reservation)) for reservation in reservations]

    return jsonify({'code': 0, 'message': '获取预约列表成功', 'status': 200, 'data': reservations_list}), 200

@app.route(apiPrefix + 'getRoomReservations', methods=['POST'])
def getRoomReservations():
    data = request.get_json()
    print(data)
    
    room_id = data.get('room_id')
    date = data.get('date')
    reservations = RBooking.getallreservationsbyroom(room_id, date)
    if reservations is None:
        return jsonify({'code': 1, 'message': '获取会议室预约列表失败', 'status': 500 })
    keys = ['id', 'room_id', 'user_id', 'start_time', 'end_time', 'date']
    reservations_list = [dict(zip(keys, reservation)) for reservation in reservations]
    return jsonify({'code': 0, 'message': '获取会议室预约列表成功', 'status': 200, 'data': reservations_list}), 200

@app.route(apiPrefix + 'insertReservation', methods=['POST'])
def insertReservation():
    data = request.get_json()
    print(data)
    
    room_id = data.get('room_id')
    user_id = data.get('user_id')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    date = data.get('date')
    subject = data.get('subject')
    reservation = RBooking.insertreservation(room_id, user_id, start_time, end_time, date, subject)
    if reservation == False:
        return jsonify({'code': 1, 'message': '添加会议室预约失败', 'status': 500 })
    return jsonify({'code': 0, 'message': '添加会议室预约成功', 'status': 200, 'data': reservation
    }), 200

@app.route(apiPrefix + 'getUserReservations', methods=['POST'])
def getUserReservations(): 
    data = request.get_json()
    user_id = data.get('user_id')
    reservations = RBooking.getuserreservations(user_id)
    if reservations is None:
        return jsonify({'code': 1, 'message': '获取用户预约列表失败', 'status': 500 })
    keys = ['id', 'room_id', 'user_id', 'start_time', 'end_time', 'date', 'subject', 'room_name']
    # date 小于今天的不显示
    reservations_list = []
    for reservation in reservations:
        print(reservation)
        if reservation[5] >= Arrow.now().format('YYYY-MM-DD'):
            reservations_list.append(dict(zip(keys, reservation)))
    # reservations_list = [dict(zip(keys, reservation)) for reservation in reservations]
    # 按开始时间排序
    reservations_list.sort(key=lambda x: x['start_time'])
    print(reservations_list)
    return jsonify({'code': 0, 'message': '获取用户预约列表成功', 'status': 200, 'data': reservations_list}), 200


##### AI 接口 #####
@app.route(apiPrefix + 'aiChat', methods=['POST'])
def getAIResult():
    prompt = '''你是一个智能办公助手，你的能力有下面几种: 1. 回答有关日程的安排。2. 回答有关会议室的安排 3. 帮助用户进行日程的插入 4. 帮助用户进行会议室的预约。5. 其它不属于以上四种的情况。无论用户输入什么，你的输出回答里都有且只能有一个阿拉伯数字，即判断是上面的五种能力中的哪一种。\n例如:用户输入:帮我预定一间下午的会议室，两个小时 你的回答:4; 用户输入:帮我查询今天研讨室的预约情况 你的回答:2; 用户输入:昨晚什么天气?利物浦赢了吗?1+1等于几 你的回答:5; 用户输入:帮我查查看今天有什么紧急的事 你的回答:1; 用户输入:帮我在旅游事项里加入一项订机票 你的回答:3;'''
    data = request.get_json()
    content = data.get('content')

    llm_qianfa = LLM.Qianfan()
    response = llm_qianfa.query(prompt + '\n\n' + content)

    # date = Arrow.now().format('YYYY-MM-DD')
    # reservations = RBooking.getallreservations(date)
    # keys = ['id', 'room_id', 'user_id', 'start_time', 'end_time', 'date']
    # reservations_list = [dict(zip(keys, reservation)) for reservation in reservations]
    # content = prompt + '\n\n' + json.dumps(reservations_list, ensure_ascii=False) + '\n\n' + content

    print( content)


    # llm = LLM.LLMInterface()
    # response = llm.query(content, prefix_prompt=prompt + '\n用户输入：' )
    print(response)
    return jsonify({'code': 0, 'message': '获取AI结果成功', 'status': 200, 'data': response}), 200




if __name__ == "__main__":
    app.run(debug=True, port=5001)
