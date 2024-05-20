from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import SqliteUtil as DBUtil

app = Flask(__name__, template_folder='../front-end', static_folder='../front-end')
CORS(app)  # 启用CORS

users = {
    "admin": "123"
}

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
    if username in users and users[username] == password:
        # return jsonify({"token": "dummy-token"}), 200
        return jsonify(
            {
                "token": "dummy-token",
                "status": 200,
            }
        )
    return jsonify({"message": "Invalid credentials"}), 401



##################  Staff接口  ##################

@app.route(apiPrefix + 'updateStaff', methods=['POST'])
def updateStaff():
    try:
        data = request.get_json()  # 使用get_json()获取JSON数据
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

if __name__ == "__main__":
    app.run(debug=True, port=5001)
