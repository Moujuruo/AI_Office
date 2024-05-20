import hashlib
import sqlite3
import json
import csv

db_name = 'from_zero'

conn = sqlite3.connect(db_name + '.db', check_same_thread=False)
cursor = conn.cursor()

def createTables():
    # 姓名、年龄、地址
    try:
        sql_create_t_staff = '''create table IF NOT EXISTS t_staff(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(20),
            age INTEGER,
            address VARCHAR(20),
            create_time TIMESTAMP NOT NULL DEFAULT (datetime('now','localtime')),
            modify_tiem TIMESTAMP NOT NULL DEFAULT (datetime('now','localtime'))
        )'''
        cursor.execute(sql_create_t_staff)
    except Exception as e:
        print(repr(e))

createTables()

staffColumns = ("id", "name", "age", "address")

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
            sql = 'insert into t_staff(%s) values(%s)' % (keys, values)
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
            sql = 'update t_staff set %s where id=%d' % (sets, id)
            cursor.execute(sql)
            conn.commit()
            result = '修改成功'
        return result
    except Exception as e:
        print(repr(e))
        return '新增或修改失败'
    

def getStaffs():
    try:
        sql = 'select * from t_staff'
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