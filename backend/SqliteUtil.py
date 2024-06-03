import hashlib
import sqlite3
import json
import csv
from sqlite3 import Error

db_name = 'Ai_work'

conn = sqlite3.connect(db_name + '.db', check_same_thread=False)
# conn.execute("PRAGMA foreign_keys = ON")  # 启用外键支持
cursor = conn.cursor()

def createTables():
    # 姓名、年龄、地址
    try:
        cursor = conn.cursor()
        sql_create_users = '''create table IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(20) UNIQUE,
            password VARCHAR(100),
            gender VARCHAR(10),
            create_time TIMESTAMP NOT NULL DEFAULT (datetime('now','localtime')),
            modify_time TIMESTAMP NOT NULL DEFAULT (datetime('now','localtime'))
        )'''
        cursor.execute(sql_create_users)
        # 创建 TodoActivity 表
        sql_create_todo_activity = '''
            CREATE TABLE IF NOT EXISTS TodoActivity(
            ActivityID INTEGER PRIMARY KEY AUTOINCREMENT,
            UserID INTEGER,
            ActivityName TEXT,
            ActivityBeginDate DATE,
            ActivityBeginTime TIME,
            ActivityEndDate DATE,
            ActivityEndTime TIME,
            create_time TIMESTAMP NOT NULL DEFAULT (datetime('now','localtime')),
            modify_time TIMESTAMP NOT NULL DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (UserID) REFERENCES users(id)
        );'''
        cursor.execute(sql_create_todo_activity)
        # 创建 TodoItem 表
        sql_create_todo_item = '''
            CREATE TABLE IF NOT EXISTS TodoItem(
                ItemID INTEGER PRIMARY KEY AUTOINCREMENT,
                ActivityID INTEGER,
                UserID INTEGER,
                ItemContent TEXT,
                ItemLevel TEXT,
                create_time TIMESTAMP NOT NULL DEFAULT (datetime('now','localtime')),
                modify_time TIMESTAMP NOT NULL DEFAULT (datetime('now','localtime')),
                FOREIGN KEY (UserID) REFERENCES users (id),
                FOREIGN KEY (ActivityID) REFERENCES TodoActivity (ActivityID)
            )
        '''
        cursor.execute(sql_create_todo_item)
        conn.commit()
        print("Tables created successfully")
    except Exception as e:
        print(repr(e))

createTables()
print("Tables created successfully")

staffColumns = ("id", "name", "age", "address")
activityColumns = ("ActivityID", "UserID", "ActivityName", "ActivityBeginDate", "ActivityBeginTime", "ActivityEndDate", "ActivityEndTime")

#### 用户相关操作 ###
def insert_user(username, password, gender):
    try:
        cursor.execute("INSERT INTO users (username, password, gender) VALUES (?, ?, ?)", (username, password, gender))
        conn.commit()
        return {"status": 200, "message": "注册成功"}
    except sqlite3.IntegrityError:
        return {"status": 400, "message": "用户名已存在"}
    except Exception as e:
        return {"status": 500, "message": f"数据库错误: {e}"}

def get_user_password(username):
    try:
        cursor.execute("SELECT password FROM users WHERE username = ?", (username,))
        result = cursor.fetchone()
        if result:
            return {"status": 200, "password": result[0]}
        else:
            return {"status": 404, "message": "用户不存在"}
    except Exception as e:
        return {"status": 500, "message": f"数据库错误: {e}"}
    
def get_user_ID(username):
    try:
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        result = cursor.fetchone()
        if result:
            return {"status": 200, "id": result[0]}
        else:
            return {"status": 404, "message": "用户不存在"}
    except Exception as e:
        return {"status": 500, "message": f"数据库错误: {e}"}


#################

##### 以下为框架操作，暂时不用 #####

def insertStaff(staff):
    try:
        print(staff) #{"name":"1","age":2,"address":"3"}
        # print("=="*30)
        staff = json.loads(staff)
        id = staff.get('id', 0)
        result = ''
        newId = id

        if id == 0:  # 新增
            keys = ''
            values = ''
            isFirst = True
            for key, value in staff.items():
                if isFirst:
                    isFirst = False
                else:
                    keys += ','
                    values += ','
                keys += key
                if isinstance(value, str):
                    values += ("'%s'" % value)
                else:
                    values += str(value)
            sql = 'insert into users(%s) values(%s)' % (keys, values)
            cursor.execute(sql)
            newId = cursor.lastrowid
            conn.commit()
            result = '新增成功'
            
        else:  # 修改
            sets = ''
            isFirst = True
            for key, value in staff.items():
                if key == 'id':
                    continue
                if isFirst:
                    isFirst = False
                else:
                    sets += ','
                sets += key
                sets += '='
                if isinstance(value, str):
                    sets += ("'%s'" % value)
                else:
                    sets += str(value)
            sql = 'update users set %s where id=%d' % (sets, id)
            cursor.execute(sql)
            conn.commit()
            result = '修改成功'
        return result
    except Exception as e:
        print(repr(e))
        return '新增或修改失败'
    

def getStaffs():
    try:
        sql = 'select * from users'
        cursor.execute(sql)
        staffs = cursor.fetchall()
        # print(staffs)
        return staffs
    except Exception as e:
        print(repr(e))
        return []
    

def getStaffsFromData(dataList):
    staffs = []
    for itemArray in dataList:   # dataList数据库返回的数据集，是一个二维数组
        #itemArray: ('1', '1', '2', '3', '4')
        staff = {}
        for columnIndex, columnName in enumerate(staffColumns):
            columnValue = itemArray[columnIndex]
            # if columnValue is None: #后面remarks要用，现在不需要
            #     columnValue = 0 if columnName in (
            #         'job', 'education', 'birth_year') else ''
            staff[columnName] = columnValue

        staffs.append(staff)
    return staffs

def deleteStaff(staff_id):
    try:
        sql = 'DELETE FROM users WHERE id = ?'
        cursor.execute(sql, (staff_id,))
        conn.commit()
        return '删除成功'
    except Exception as e:
        print(repr(e))
        return '删除失败'
    

#######################
    
def updateActivity(activity):
    try:
        print(activity)  # {"UserID": 1, "ActivityName": "Meeting", "ActivityBeginDate": "2024-05-21", "ActivityBeginTime": "10:00:00", "ActivityEndDate": "2024-05-21", "ActivityEndTime": "11:00:00"}
        activity = json.loads(activity)
        activityID = activity.get('ActivityID', 0)
        UserID = int(activity.get('UserID', 0))
        result = ''
        newActivityID = activityID

        if activityID == 0:  # 新增
            keys = ''
            values = ''
            isFirst = True
            for key, value in activity.items():
                if isFirst:
                    isFirst = False
                else:
                    keys += ','
                    values += ','
                keys += key
                if isinstance(value, str):
                    values += ("'%s'" % value)
                else:
                    values += str(value)
            sql = 'INSERT INTO TodoActivity(%s) VALUES(%s)' % (keys, values)
            print(sql)
            cursor.execute(sql)
            newActivityID = cursor.lastrowid
            conn.commit()
            result = '新增成功'
            
        else:  # 修改
            sets = ''
            isFirst = True
            for key, value in activity.items():
                if key == 'ActivityID':
                    continue
                if isFirst:
                    isFirst = False
                else:
                    sets += ','
                sets += key
                sets += '='
                if isinstance(value, str):
                    sets += ("'%s'" % value)
                else:
                    sets += str(value)
            sql = 'UPDATE TodoActivity SET %s WHERE ActivityID=%d and UserID=%d' % (sets, activityID, UserID)
            cursor.execute(sql)
            conn.commit()
            result = '修改成功'
        return result
    except Exception as e:
        print(repr(e))
        return '新增或修改失败'

def getActivities(UserID):
    try:
        sql = 'SELECT * FROM TodoActivity where UserID = %d' % UserID
        cursor.execute(sql)
        activities = cursor.fetchall()
        return activities
    except Exception as e:
        print(repr(e))
        return []

def getActivitiesFromData(dataList):
    activities = []
    for itemArray in dataList:   # dataList数据库返回的数据集，是一个二维数组
        # itemArray: (1, 1, 'Meeting', '2024-05-21', '10:00:00', '2024-05-21', '11:00:00')
        activity = {}
        for columnIndex, columnName in enumerate(activityColumns):
            columnValue = itemArray[columnIndex]
            activity[columnName] = columnValue
        activities.append(activity)
    return activities
 
def deleteActivity(activity_id):
    try:
        sql = 'DELETE FROM TodoActivity WHERE ActivityID = ?'
        cursor.execute(sql, (activity_id,))
        conn.commit()
        return '删除成功'
    except Exception as e:
        print(repr(e))
        return '删除失败'

def insertOrUpdateTodoItem(item):
    try:
        item = json.loads(item)
        print(item)
        item_id = item.get('ItemID', 0)
        ItemContent = item.get('ItemContent', '')
        ItemLevel = item.get('ItemLevel', 0)
        # UserID = int(item.get('UserID', 0))
        print(item_id,ItemContent,ItemLevel)
        if item_id == 0:  # 新增
            keys = ''
            values = ''
            isFirst = True
            for key, value in item.items():
                if isFirst:
                    isFirst = False
                else:
                    keys += ','
                    values += ','
                keys += key
                if isinstance(value, str):
                    values += ("'%s'" % value)
                else:
                    values += str(value)
            sql = 'insert into TodoItem(%s) values(%s)' % (keys, values)
            print("add:"+sql)
            cursor.execute(sql)
            newId = cursor.lastrowid
            conn.commit()
            result = '新增成功'
            return result
        else:  # 修改
            sets = ''
            isFirst = True
            for key, value in item.items():
                if key == 'ItemID':
                    continue
                if isFirst:
                    isFirst = False
                else:
                    sets += ','
                sets += key
                sets += '='
                if isinstance(value, str):
                    sets += ("'%s'" % value)
                else:
                    sets += str(value)
            sql = 'update TodoItem set %s where ItemID=%d' % (sets, item_id)
            print("edit:"+sql)
            cursor.execute(sql)
            conn.commit()
            return '修改成功'
    except Error as e:
        print(e)
        return '新增或修改失败'


def deleteTodoItem(item_id):
    try:
        sql = 'DELETE FROM TodoItem WHERE ItemID = ?'
        cursor.execute(sql, (item_id,))
        conn.commit()
        return '删除成功'
    except Error as e:
        print(e)
        return '删除失败'
    

def getTodoItems():
    try:
        sql = 'SELECT * FROM TodoItem'
        cursor.execute(sql)
        return cursor.fetchall()
    except Error as e:
        print(e)
        return []

def getTodoItemsFromData(dataList):
    items = []
    for itemArray in dataList:
        item = {
            "ItemID": itemArray[0],
            "ActivityID": itemArray[1],
            "UserID": itemArray[2],
            "ItemContent": itemArray[3],
            "ItemLevel": itemArray[4]
        }
        items.append(item)
    return items

def getTodoItemsByActivity(activity_id):
    try:
        sql = 'SELECT * FROM TodoItem WHERE ActivityID = ?'
        cursor.execute(sql, (activity_id,))
        return cursor.fetchall()
    except Error as e:
        print(e)
        return []




