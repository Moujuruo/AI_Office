# encoding: utf-8
import re
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
from . import SqliteUtil as DBUtil
from . import sqlite_roombooking as RBooking
from . import sqlite_note as RNote
from . import sqlite_team as Team
from werkzeug.utils import secure_filename
import os
from . import llm_interface as LLM
from arrow import Arrow
import pytesseract
from PIL import Image
import base64
from openai import OpenAI
import arrow

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = './uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
CORS(app)  # 启用CORS


@app.route('/hi')
def hi():
    return 'hi~'

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    # 使用绝对路径指向uploads目录
    return send_from_directory(os.path.abspath('../uploads'), filename)

@app.route('/assets/<filename>')
def assets_file(filename):
    # 使用绝对路径指向assets目录
    return send_from_directory(os.path.abspath('../assets'), filename)


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

    
# @app.route('/uploads/<filename>')
# def uploaded_file(filename):
#     return send_from_directory("../uploads", filename)

# @app.route('/assets/<filename>')
# def assets_file(filename):
#     return send_from_directory("../assets", filename)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    # 使用绝对路径指向uploads目录
    return send_from_directory(os.path.abspath('../uploads'), filename)

@app.route('/assets/<filename>')
def assets_file(filename):
    # 使用绝对路径指向assets目录
    return send_from_directory(os.path.abspath('../assets'), filename)

@app.route(apiPrefix + 'getAvatarById', methods=['GET'])
def getAvatarById():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'status': 400, 'message': 'user_id is required'}), 400

    result = DBUtil.get_user_avatar_by_id(user_id)
    if result:
        return jsonify({'status': 200, 'message': 'success', 'data': result}), 200
    else:
        return jsonify({'status': 404, 'message': 'User not found'}), 404

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
        return json.dumps({'code': -4, 'message': str(e)}), 500
        return json.dumps({'code': -4, 'message': str(e)}), 500

@app.route(apiPrefix + 'getActivityList/<int:job>')
def getActivityList(job):
    try:
        array = DBUtil.getActivities(job)
        jsonActivities = DBUtil.getActivitiesFromData(array)
        return json.dumps(jsonActivities)
    except Exception as e:
        return json.dumps({'code': 1, 'message': str(e)}), 500

@app.route(apiPrefix + 'deleteActivity/<int:id>', methods=['DELETE'])
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

def get_dates_between(start_date, end_date):
    from datetime import datetime, timedelta
    date_list = []
    current_date = datetime.strptime(start_date, '%Y-%m-%d')
    end_date = datetime.strptime(end_date, '%Y-%m-%d')
    while current_date <= end_date:
        date_list.append(current_date.strftime('%Y-%m-%d'))
        current_date += timedelta(days=1)
    return date_list

@app.route(apiPrefix + 'getActivityStatistics/<int:job>')
def getActivityStatistics(job):
    try:
        array = DBUtil.getActivities(job)
        jsonActivities = DBUtil.getActivitiesFromData(array)

        # Initialize a dictionary to hold the counts
        activity_counts = {}

        for activity in jsonActivities:
            begin_date = activity["ActivityBeginDate"]
            end_date = activity["ActivityEndDate"]
            dates_in_range = get_dates_between(begin_date, end_date)
            for date in dates_in_range:
                if date in activity_counts:
                    activity_counts[date] += 1
                else:
                    activity_counts[date] = 1

        return json.dumps(activity_counts)
    except Exception as e:
        return json.dumps({'code': 1, 'message': str(e)}), 500

##################  Item接口  ##################
@app.route(apiPrefix + 'updateItem', methods=['POST'])
def addOrUpdateItem():
    try:
        print(request.get_json())
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
    user_id = data.get('user_id') # 可能是string，待查
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    date = data.get('date')
    subject = data.get('subject')
    type = data.get('type')
    team_id = data.get('team_id')
    
    if type != 'team':
        reservation = RBooking.insertreservation(room_id, user_id, start_time, end_time, date, subject)
    else:
        reservation = RBooking.insertreservation_team(room_id, user_id, start_time, end_time, date, subject, team_id)

    if reservation == False:
        return jsonify({'code': 1, 'message': '添加会议室预约失败', 'status': 500 })
    print(room_id)
    room_name = RBooking.getroomname(room_id)
    activity_name = "会议 - " + room_name + " - " + subject
    meeting_activity = {}
    meeting_activity['UserID'] = user_id
    meeting_activity['ActivityName'] = activity_name
    meeting_activity['ActivityBeginDate'] = date
    meeting_activity['ActivityEndDate'] = date
    meeting_activity['ActivityBeginTime'] = start_time
    meeting_activity['ActivityEndTime'] = end_time
    print(meeting_activity)
    result = DBUtil.updateActivity(json.dumps(meeting_activity))

    if type == 'team':
        member_ids = Team.get_team_members(team_id)
        for member_id in member_ids:
            if int(member_id[0]) != int(user_id):
                activity_name = "会议 - " + room_name + " - " + subject
                meeting_activity = {}
                meeting_activity['UserID'] = member_id[0]
                meeting_activity['ActivityName'] = activity_name
                meeting_activity['ActivityBeginDate'] = date
                meeting_activity['ActivityEndDate'] = date
                meeting_activity['ActivityBeginTime'] = start_time
                meeting_activity['ActivityEndTime'] = end_time
                result = DBUtil.updateActivity(json.dumps(meeting_activity))
                result2 = Team.insertMeetingRoomReservation(room_id, member_id[0], user_id, start_time, end_time, date, subject, team_id)

                # insertOrUpdateTodoItem
                # item = {}
                # item['ActivityID'] = result['ActivityID']
                # item['UserID'] = member_id[0]
                # item['ItemCotent'] = '会议 - ' + room_name + ' - ' + subject

                
                print(result2)
                


    if result != '新增成功' and result != '修改成功':
        return jsonify({'code': 1, 'message': '添加会议室预约到日程失败', 'status': 500 })

    return jsonify({'code': 0, 'message': '添加会议室预约成功', 'status': 200, 'data': reservation
    }), 200


#  deleteReservation
@app.route(apiPrefix + 'deleteReservation', methods=['POST'])
def deleteReservation():
    data = request.get_json()
    print(data)
    reservation_id = data.get('reservation_id')
    reservation = RBooking.getreservation(reservation_id)
    type = reservation[7]
    user_id = data.get('user_id')
    result = RBooking.deletereservation(user_id, reservation_id)
    room_id, user_id, start_time, end_time, date, subject, team_id = reservation[1], reservation[2], reservation[3], reservation[4], reservation[5], reservation[6], reservation[7]
    room_name = RBooking.getroomname(room_id)
    if type != 0:
        member_ids = Team.get_team_members(team_id)
        for member_id in member_ids:
            if int(member_id[0]) != int(user_id):
                result2 = Team.insertMeetingRoomReservation(room_id, member_id[0], user_id, start_time, end_time, date, subject, team_id, 1)
            # print(result2)
    activity_name = "会议 - " + room_name + " - " + subject
    result3 = DBUtil.deleteActivityByActivityName(activity_name, date)
    print(result3)

    if result == False:
        return jsonify({'code': 1, 'message': '删除会议室预约失败', 'status': 500 })
    return jsonify({'code': 0, 'message': '删除会议室预约成功', 'status': 200 }), 200    

# getReservationInfo
@app.route(apiPrefix + 'getReservationInfo', methods=['POST'])
def getReservationInfo():
    data = request.get_json()
    user_id = data.get('userID')
    reservations = Team.getMeetingRoomReservation(user_id)
    if reservations is None:
        return jsonify({'code': 1, 'message': '获取会议室预约列表失败', 'status': 500 })
    # room_id, room_name, user_id, reserve_user_id, reserve_user_name, start_time, end_time, date, subject, team_id, team_name, type
    keys = ['id', 'room_id', 'room_name', 'user_id', 'reserve_user_id', 'reserve_user_name', 'start_time', 'end_time', 'date', 'subject', 'team_id', 'team_name', 'type']
    reservations_list = [dict(zip(keys, reservation)) for reservation in reservations]
    return jsonify({'code': 0, 'message': '获取会议室预约列表成功', 'status': 200, 'data': reservations_list}), 200

# acceptReservation
@app.route(apiPrefix + 'acceptReservation', methods=['POST'])  
def acceptReservation():
    data = request.get_json()
    user_id = data.get('userID')
    reservation_id = data.get('reservation_id')
    type = data.get('type')
    result = Team.deleteMeetingRoomReservation(reservation_id, user_id, type)
    if result == False:
        return jsonify({'code': 1, 'message': '已读失败', 'status': 500 })
    return jsonify({'code': 0, 'message': '已读成功', 'status': 200 }), 200


@app.route(apiPrefix + 'getUserReservations', methods=['POST'])
def getUserReservations(): 
    data = request.get_json()
    user_id = data.get('user_id')
    reservations = RBooking.getuserreservations(user_id)
    print(reservations)
    if reservations is None:
        return jsonify({'code': 1, 'message': '获取用户预约列表失败', 'status': 500 })
    keys = ['id', 'room_id', 'user_id', 'start_time', 'end_time', 'date', 'subject', 'type', 'room_name']
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
reservation_flags = {}
chat_history = {}
@app.route(apiPrefix + 'aiChat', methods=['POST'])
def getAIResult():
    llm_qianfa = LLM.Qianfan()
    llm = LLM.LLMInterface()
    llm_minimax = LLM.MiniMax()
    data = request.get_json()
    userID = data.get('userID')
    content = data.get('content')
    day_and_time = Arrow.now().format('YYYY-MM-DD HH:mm:ss')

    if userID in reservation_flags and reservation_flags[userID]:
        prompt_capacity = '''请判断这句话里是否含有预约会议室的人数信息，若有只要回答人数，若没有则回答无。 例如：我想预定一个五人的会议室。 回答：5； 我想在明天定一个会议室，回答：无'''
        content1 = prompt_capacity + '\n\n' + content
        print(content1)
        response = llm_qianfa.query(content1)
        print(response)
        try:
            number_of_people = re.findall(r'\d+', response)[0]
            number_of_people = int(number_of_people)
        except:
            number_of_people = 0

        meeting_rooms = RBooking.getroombycapacity(number_of_people)
        keys = ['id', 'name', 'floor', 'capacity', 'equipment']
        meeting_rooms = [dict(zip(keys, room)) for room in meeting_rooms]

        prompt_head = '''你是会议室预约小助手，会议室预约的必选项是会议主题、会议预约日期、会议预约时间（可以是时间段也可以是时间长度，若是后者，你要为用户选择一个时间，格式例如9:00-12:00），可选项是会议人数(default=5)，会议室名称(default根据数据选择）。你要根据用户输入判断是否覆盖了必选项的所有。如果缺了，请你必须分点告知用户需要补充什么信息，此时**不需要**返回json；如果没缺：你**仅**需返回一个json格式，key必须为：subject, date, time, room_name, room_id, number_of_people。\n\n'''

        history = chat_history.get(userID)
        # 列表合并为字符串
        history = '\n'.join(history)
        
        # content按\n分割取最后一个
        content = content.split('\n')[-1]

        content2 = prompt_head + '可用会议室：' + str(meeting_rooms) + '\n\n' + '现在的时间是：' + day_and_time + '\n\n' + '请按照我的指令执行：' + '\n\n' + history + '\n\n' + content
        print("==============", content2)

        response = llm_minimax.query(content2)
        print(response)

        try:
            # json
            response = json.loads(response)
            print(response)
            reservation_flags[userID] = False
            chat_history[userID] = []
            return jsonify({'code': 0, 'message': '获取AI结果成功', 'status': 200, 'data': response, 'json': "true"}), 200

        except:
            reservation_flags[userID] = True
            if chat_history.get(userID) is None:
                chat_history[userID] = []
            chat_history[userID].append(content)
            return jsonify({'code': 0, 'message': '获取AI结果成功', 'status': 200, 'data': response}), 200
        

    prompt = '''你是一个智能办公助手，你的能力有下面几种: 1. 回答有关日程的安排。2. 回答有关会议室的安排、预约情况等 3. 帮助用户进行日程的插入 4. 帮助用户进行会议室的预约。5. 其它不属于以上四种的情况。无论用户输入什么，你的输出回答里都有且只能有一个阿拉伯数字，即判断是上面的五种能力中的哪一种。\n例如:用户输入:帮我预定一间下午的会议室，两个小时 你的回答:4; 用户输入:今天我有哪些会议 你的回答:2; 用户输入:昨晚什么天气?利物浦赢了吗?1+1等于几 你的回答:5; 用户输入:帮我查查看今天有什么紧急的事 你的回答:1; 用户输入:帮我在旅游事项里加入一项订机票 你的回答:3; 用户输入：我想预定一间会议室 你的回答：4；用户输入：我今天有哪些日程 你的回答：1'''
    
    print(content)

    
    response = llm_qianfa.query(prompt + '\n\n' + content)
    print(response)
    # 提取response中的数字
    try:
        response_type = re.findall(r'\d+', response)[0]
    except:
        response_type = '5'

    if (response_type == '1'):
        activities = DBUtil.getActivities(int(userID))
        # print(activities)
        keys = ["ActivityID", "UserID", "ActivityName", "ActivityBeginDate", "ActivityBeginTime", "ActivityEndDate", "ActivityEndTime"]
        # keys和activities都删去第1列（从0开始）
        activities_list = [dict(zip(keys, activity)) for activity in activities]
        # 把日期在3天前的日程删去
        activities_list = [
            activity for activity in activities_list
            if arrow.get(activity["ActivityEndDate"], 'YYYY-MM-DD').shift(days=3) >= Arrow.now()
        ]
        print(activities_list)
        prompt_head = '''你是我的日程问答小助手，以下是我的日程安排，日程分为尚未开始，正在进行，已经结束三种：\n\n'''
        prompt_tail = '''\n\n请回答我的问题(注意今天的日期在活动开始和结束日期之间的都算今天正在进行的日程，例如假设今天是2024年6月12日，那么如果我问今天有哪些日程，**那么我问的是今天正在进行的日程有哪些**你要回答的内容包括开始在12日前(例如6月1日)且结束在12日后的所有日程(例如6月30日))：'''
        prompt = prompt_head + str(activities_list) + '\n\n' + '现在的时间是：' + day_and_time + '\n\n' + prompt_tail + '\n\n'
        content = prompt + '\n\n' + content
        # response = llm.query(content, prefix_prompt=prompt)
        response = llm_minimax.query(content)
    elif (response_type == '2'):
        reservations = RBooking.getallreservations(Arrow.now().format('YYYY-MM-DD'))
        keys = ['id', 'room_id', 'user_id', 'start_time', 'end_time', 'date']
        reservations_list = [dict(zip(keys, reservation)) for reservation in reservations]
        if len(reservations_list) == 0:
            reservations_list = ["今天所有会议室都可用，暂无预约记录"]
        prompt_head = '''你是我的预约记录问答小助手，以下是我的预约记录：\n'''
        prompt_tail = '''\n\n请注意，你一定要回答的正确，例如问今天有哪些会议，就不要输出昨天的会议。请回答我的问题：'''
        prompt = prompt_head + str(reservations_list) + '\n\n' + '现在的时间是：' + day_and_time + '\n\n' + '我的user_id是' + str(userID) + prompt_tail + '\n\n'
        content = prompt + '\n\n' + content
        print(content)
        response = llm_minimax.query(content)
    elif (response_type == '4'):
        prompt_capacity = '''请判断这句话里是否含有预约会议室的人数信息，若有只要回答人数，若没有则回答无。 例如：我想预定一个五人的会议室。 回答：5； 我想在明天定一个会议室，回答：无'''
        content1 = prompt_capacity + '\n\n' + content
        print(content1)
        response = llm_qianfa.query(content1)
        print(response)
        try:
            number_of_people = re.findall(r'\d+', response)[0]
            number_of_people = int(number_of_people)
        except:
            number_of_people = 0

        meeting_rooms = RBooking.getroombycapacity(number_of_people)
        print(meeting_rooms)
        keys = ['id', 'name', 'floor', 'capacity', 'equipment']
        rooms_list = [dict(zip(keys, room)) for room in meeting_rooms]

        prompt_head = '''你是会议室预约小助手，会议室预约的必选项是会议主题、会议预约日期、会议预约时间（可以是时间段也可以是时间长度，若是后者，你要为用户选择一个时间, 格式例如9:00-12:00），可选项是会议人数(default=5)，会议室名称(default根据数据选择）。你要根据用户输入判断是否覆盖了必选项的所有。如果有缺漏，请你必须分点告知用户需要补充什么信息，此时**不需要**返回json；如果没缺：你**仅**需返回一个json格式，key必须为：subject, date, time, room_name, room_id, number_of_people。\n\n'''

        content2 = prompt_head + '可用会议室：' + str(rooms_list) + '\n\n' + '现在的时间是：' + day_and_time + '\n\n' + '请按照我的指令执行：' + '\n\n' + content
        print(content2)
        response = llm_minimax.query(content2)
        print(response)

        try:
            # json
            print(response)
            reservation_flags[userID] = False
            chat_history[userID] = []
            return jsonify({'code': 0, 'message': '获取AI结果成功', 'status': 200, 'data': response}), 200
        except:
            reservation_flags[userID] = True
            if chat_history.get(userID) is None:
                chat_history[userID] = []
            chat_history[userID].append(content)
            return jsonify({'code': 0, 'message': '获取AI结果成功', 'status': 200, 'data': response}), 200





    # date = Arrow.now().format('YYYY-MM-DD')
    # reservations = RBooking.getallreservations(date)
    # keys = ['id', 'room_id', 'user_id', 'start_time', 'end_time', 'date']
    # reservations_list = [dict(zip(keys, reservation)) for reservation in reservations]
    # content = prompt + '\n\n' + json.dumps(reservations_list, ensure_ascii=False) + '\n\n' + content

    # print(content)


    # llm = LLM.LLMInterface()
    # response = llm.query(content, prefix_prompt=prompt + '\n用户输入：' )
    print(response)
    return jsonify({'code': 0, 'message': '获取AI结果成功', 'status': 200, 'data': response}), 200

############ team接口 ############
@app.route(apiPrefix + 'getAllTeams', methods=['POST'])
def getAllTeams(): 

    data = request.get_json()
    userID = data['userID']
    
    # 获取用户的团队信息，队长的团队排在前面
    teams = Team.get_user_teams_with_captain_flag(userID)
    if teams is False:
        return jsonify({"error": "Failed to retrieve teams"}), 500
    
    # 获取每个团队的成员信息
    team_list = []
    for team in teams:
        team_id = team[0]
        team_info = {
            "team_id": team[0],
            "team_name": team[1],
            "is_captain": team[3],
            "members": []
        }
        
        members = Team.get_team_members_with_details(team_id)
        if members is False:
            return jsonify({"error": f"Failed to retrieve members for team {team_id}"}), 500
        
        for member in members:
            team_info["members"].append({
                "member_id": member[0],
                "is_captain": member[1],
                "username": member[2],
            })
        
        team_list.append(team_info)
    # return jsonify({'code': 0, 'message': '获取团队列表成功', 'status': 200, 'data': result}), 200
    return jsonify({'code': 0, 'message': '获取团队列表成功', 'status': 200, 'data': team_list}), 200

# insertTeam
@app.route(apiPrefix + 'insertTeam', methods=['POST'])
def insertTeam():
    data = request.get_json()
    userID = data['userID']
    teamName = data['teamName']

    result = Team.insertTeam(teamName, userID)
    if result is False:
        return jsonify({"error": "Failed to insert team", "status": 500}), 500
    return jsonify({"message": "Team created successfully", "status": 200}), 200

# inviteMember
@app.route(apiPrefix + 'inviteMember', methods=['POST'])
def inviteMember():
    data = request.get_json()
    teamID = data['teamID']
    membername = data['member_name']
    memberID = DBUtil.get_user_ID(membername)
    if memberID["status"] == 404:
        return jsonify({"data": "Member not found", "status": 404}), 404

    member_status = DBUtil.get_user_status(memberID)
    if member_status["status"] == 404:
        return jsonify({"data": "Member not found", "status": 404}), 404
    if member_status["message"] == 0:
        return jsonify({"data": "成员不在线", "status": 400}), 400

    result = Team.insertTeamInvitation(teamID, memberID["id"])
    if result is False:
        return jsonify({"data": "Failed to invite member", "status": 500}), 500
    return jsonify({"data": "Member invited successfully", "status": 200}), 200

# getBeInvitedTeams
@app.route(apiPrefix + 'getBeInvitedTeams', methods=['POST'])
def getBeInvitedTeams():
    data = request.get_json()
    userID = data['userID']
    result = Team.search_in_team_invitation(userID)
    if result is False:
        return jsonify({"data": "Failed to get team list", "status": 500}), 500
    key = ['team_id', 'user_id', 'captain_id']
    # captain_id 要通过result中的team_id去查询get_team_captatin
    # result每个元组的第一个元素是team_id
    for i in range(len(result)):
        result[i] = [result[i][0], result[i][1], Team.get_team_captain(result[i][0])[0]]
    result = list(map(lambda x: dict(zip(key, x)), result))
    return jsonify({"data": result, "status": 200}), 200

    # return jsonify({"data": result, "status": 200}), 200

# agreeinvitation
@app.route(apiPrefix + 'agreeinvitation', methods=['POST'])
def agreeinvitation():
    data = request.get_json()
    teamID = data['teamID']
    userID = data['userID']
    result_1 = Team.deleteTeamInvitation(teamID, userID)
    if result_1 is False:
        return jsonify({"data": "Failed to agree invitation", "status": 500}), 500
    result_2 = Team.insertTeamMember(teamID, userID)
    if result_2 is False:
        return jsonify({"data": "Failed to agree invitation", "status": 500}), 500
    return jsonify({"data": "Success to agree invitation", "status": 200}), 200

# disagreeinvitation
@app.route(apiPrefix + 'disagreeinvitation', methods=['POST'])
def disagreeinvitation():
    data = request.get_json()
    teamID = data['teamID']
    userID = data['userID']
    result = Team.deleteTeamInvitation(teamID, userID)
    if result is False:
        return jsonify({"data": "Failed to disagree invitation", "status": 500}), 500
    return jsonify({"data": "Success to disagree invitation", "status": 200}), 200

@app.route(apiPrefix + 'deleteTeam', methods=['POST'])
def deleteTeam():
    data = request.get_json()
    print(data)
    teamID = data['teamID']
    userID = data['userID']
    userID = int(userID)
    captainID = Team.get_team_captain(teamID)[0]
    
    if captainID != userID:
        return jsonify({"data": "You are not the captain", "status": 400}), 400
    result = Team.delete_team(teamID)
    if result is False:
        return jsonify({"data": "Failed to delete team", "status": 500}), 500
    return jsonify({"data": "Success to delete team", "status": 200}), 200

# deleteMember
@app.route(apiPrefix + 'deleteMember', methods=['POST'])
def deleteMember():
    data = request.get_json()
    teamID = data['teamID']
    userID = data['userID']
    userID = int(userID)
    memberID = data['memberID']
    captainID = Team.get_team_captain(teamID)[0]
    if captainID != userID:
        return jsonify({"data": "非队长无权限删除", "status": 400}), 400
    if memberID == captainID:
        return jsonify({"data": "队长不能被删除", "status": 400}), 400

    result = Team.deleteTeamMember(teamID, memberID)
    if result is False:
        return jsonify({"data": "Failed to delete member", "status": 500}), 500
    return jsonify({"data": "Success to delete member", "status": 200}), 200

# updateTeamName
@app.route(apiPrefix + 'updateTeamName', methods=['POST'])
def updateTeamName():
    data = request.get_json()
    teamID = data['teamID']
    userID = data['userID']
    userID = int(userID)
    teamName = data['teamName']
    captainID = Team.get_team_captain(teamID)[0]
    if captainID != userID:
        return jsonify({"data": "非队长无权限修改", "status": 400}), 400
    result = Team.change_team_name(teamID, teamName)
    if result is False:
        return jsonify({"data": "Failed to update team name", "status": 500}), 500
    return jsonify({"data": "Success to update team name", "status": 200}), 200


##################  Note接口  ##################
@app.route(apiPrefix + 'updateNote', methods=['POST'])
def insertNote():
    data = request.get_json()
    note_title = data.get('title')
    note_content = data.get('content')
    user_id = data.get('userName')
    importance = data.get('importance')
    savetime = data.get('savetime')
    
    existing_note = RNote.getNoteByTitle(note_title, user_id)
    if existing_note:
        result = RNote.updateNote(note_title, note_content, user_id, importance, savetime)
    else:
        result = RNote.insertNote(note_title, note_content, user_id, importance, savetime)
    return jsonify(result), result['status']

@app.route(apiPrefix + 'getNoteList/<user>')
def getNoteList(user):
    try:
        array = RNote.getNoteTitleList(user)
        note_titles = [t[0] for t in array]
        note_importances = [t[1] for t in array]
        note_savetimes = [t[2] for t in array]
        response = {
           'status': 200,
           'titles': note_titles,
           'importances': note_importances,
           'save_times': note_savetimes
        }
        return json.dumps(response)
    except Exception as e:
        return json.dumps({'status': 500, 'data': None})


@app.route(apiPrefix + 'getGroupNoteList/<user>')
def getGroupNoteList(user):
    try:
        array = RNote.getGroupNoteTitleList(user)
        note_titles = [t[0] for t in array]
        note_importances = [t[1] for t in array]
        note_savetimes = [t[2] for t in array]
        note_editor = [t[3] for t in array]
        response = {
           'status': 200,
           'titles': note_titles,
           'importances': note_importances,
           'save_times': note_savetimes,
           'editors': note_editor
        }
        return json.dumps(response)
    except Exception as e:
        print(e)
        return json.dumps({'status': 500, 'data': None})

@app.route(apiPrefix + 'getNoteContent/<user>/<title>')
def getNoteContent(user, title):
    try:
        content = RNote.getNoteContent(user, title);
        response = {
           'status': 200,
           'data': content
        }
        return json.dumps(response)
    except Exception as e:
        return json.dumps({'status': 500, 'data': None})

@app.route(apiPrefix + 'deleteNote/<user>/<title>')
def deleteNoteByTitle(user, title):
    try:
        RNote.deleteNoteByTitle(user, title)
        return json.dumps({'status': 200, 'data': None})
    except Exception as e:
        return json.dumps({'status': 500, 'data': None})



@app.route(apiPrefix + 'uploadNoteImage', methods=['POST'])
def uploadNoteImage():
    if 'file' not in request.files:
        return jsonify({'status': 'fail', 'message': 'No file part'}), 400
    file = request.files['file']
    print(file)
    if file.filename == '':
        return jsonify({'status': 'fail', 'message': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        try:
            # image = Image.open(file)
            # text = pytesseract.image_to_string(image, 'chi_sim')
            # print(text)

            client = OpenAI(api_key='11YPrT6yoBSigAicbBtMtNKm8tN3UPf6qQSjFMghmeqlVWwr31cUVNIdOFvFvddFv', base_url="https://api.stepfun.com/v1")
            img_data = file.read()
            img_str = base64.b64encode(img_data).decode('ascii')
            completion = client.chat.completions.create(
            model="step-1v-32k",
            messages=[
                {
                    "role": "system",
                    "content": "你是一名OCR转换专家",
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "请识别图中的文字，并转化为html格式以<p>与</p>作为开头与结尾，使其符合笔记的基本格式"
                            "对于换行要使用<br>标签，对于标题要使用对应的<h1><h2>等标签，注意不要输出图片链接信息，"
                            "在文本的开头加入<h1>标题</h1>，标题根据图片中文本的内容进行总结生成"
                            "在最后加入对这段文字的理解，并在理解前加入两段空行，以二级标题: <h2>理解</h2>开头，标题后面跟上你的理解内容。"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": "data:image/webp;base64,{}".format(img_str),
                            },
                        },
                    ],
                },
            ],
            )
            result = completion.choices[0].message.content
            print(result)
            return jsonify({'status': 200, 'message': f'{result}'}), 200
        except Exception as e:
            print(e)
            return jsonify({'status': 'fail', 'message': 'OCR fail'}), 400
    else:
        return jsonify({'status': 'fail', 'message': 'Invalid file type'}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
