from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import SqliteUtil as DBUtil

app = Flask(__name__, template_folder='../front-end', static_folder='../front-end')
CORS(app)  # 启用CORS


@app.route('/hi')
def hi():
    return 'hi~'

# api接口前缀
apiPrefix = '/api/v1/'


##################  Login接口  ##################
@app.route(apiPrefix + 'login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    result = DBUtil.get_user_password(username)
    id = DBUtil.get_user_ID(username)["id"]
    print(id)
    if result["status"] == 200 and result["password"] == password:
        # return jsonify({"token": "dummy-token", "status": 200})
        return jsonify({"userID": id, "status": 200}), 200
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
        array = DBUtil.getActivities()
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


if __name__ == "__main__":
    app.run(debug=True, port=5001)
