# encoding: utf-8
import re
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import SqliteUtil as DBUtil
import sqlite_roombooking as RBooking
import sqlite_note as RNote
import sqlite_team as Team
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

@app.route('/assets/<filename>')
def assets_file(filename):
    return send_from_directory("../assets", filename)

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
    activities = DBUtil.getActivities(user_id)
    flag = False
    for activity in activities:
        if activity[2] == "会议":
            flag = True
            break
    if flag == False:
        meeting_activity = {}
        meeting_activity['UserID'] = user_id
        meeting_activity['ActivityName'] = "会议"
        meeting_activity['ActivityBeginDate'] = date
        meeting_activity['ActivityEndDate'] = date
        meeting_activity['ActivityBeginTime'] = start_time
        meeting_activity['ActivityEndTime'] = end_time
        result = DBUtil.updateActivity(json.dumps(meeting_activity))
        if result != '新增成功' and result != '修改成功':
            return jsonify({'code': 1, 'message': '添加会议室预约到日程失败', 'status': 500 })

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
    prompt = '''你是一个智能办公助手，你的能力有下面几种: 1. 回答有关日程的安排。2. 回答有关会议室的安排、预约情况等 3. 帮助用户进行日程的插入 4. 帮助用户进行会议室的预约。5. 其它不属于以上四种的情况。无论用户输入什么，你的输出回答里都有且只能有一个阿拉伯数字，即判断是上面的五种能力中的哪一种。\n例如:用户输入:帮我预定一间下午的会议室，两个小时 你的回答:4; 用户输入:帮我查询今天研讨室的预约情况 你的回答:2; 用户输入:昨晚什么天气?利物浦赢了吗?1+1等于几 你的回答:5; 用户输入:帮我查查看今天有什么紧急的事 你的回答:1; 用户输入:帮我在旅游事项里加入一项订机票 你的回答:3;'''
    data = request.get_json()
    userID = data.get('userID')
    content = data.get('content')

    llm_qianfa = LLM.Qianfan()
    llm = LLM.LLMInterface()
    response = llm_qianfa.query(prompt + '\n\n' + content)
    print(response)
    # 提取response中的数字
    response_type = re.findall(r'\d+', response)[0]
    day_and_time = Arrow.now().format('YYYY-MM-DD HH:mm:ss')

    if (response_type == '1'):
        activities = DBUtil.getActivities(int(userID))
        # print(activities)
        keys = ["ActivityID", "UserID", "ActivityName", "ActivityBeginDate", "ActivityBeginTime", "ActivityEndDate", "ActivityEndTime"]
        # keys和activities都删去第1列（从0开始）
        activities_list = [dict(zip(keys, activity)) for activity in activities]
        prompt_head = '''你是我的日程问答小助手，以下是我的日程安排：\n\n'''
        prompt_tail = '''\n\n请回答我的问题：'''
        prompt = prompt_head + str(activities_list) + '\n\n' + '现在的时间是：' + day_and_time + '\n\n' + prompt_tail + '\n\n'
        response = llm.query(content, prefix_prompt=prompt)
    elif (response_type == '2'):
        reservations = RBooking.getallreservations(Arrow.now().format('YYYY-MM-DD'))
        keys = ['id', 'room_id', 'user_id', 'start_time', 'end_time', 'date']
        reservations_list = [dict(zip(keys, reservation)) for reservation in reservations]
        prompt_head = '''你是我的预约记录问答小助手，以下是我的预约记录：\n\n'''
        prompt_tail = '''\n\n请回答我的问题：'''
        prompt = prompt_head + str(reservations_list) + '\n\n' + '现在的时间是：' + day_and_time + '\n\n' + prompt_tail + '\n\n'
        response = llm.query(content, prefix_prompt=prompt)



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
        return jsonify({"data": "You are not the captain", "status": 400}), 400
    result = Team.deleteTeamMember(teamID, memberID)
    if result is False:
        return jsonify({"data": "Failed to delete member", "status": 500}), 500
    return jsonify({"data": "Success to delete member", "status": 200}), 200


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

if __name__ == "__main__":
    app.run(debug=True, port=5001)
