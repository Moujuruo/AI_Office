import hashlib
import sqlite3
import json
import csv
from sqlite3 import Error
import threading

db_name = 'Ai_work'

lock_threading = threading.Lock()
conn = sqlite3.connect(db_name + '.db', check_same_thread=False)
# conn.execute("PRAGMA foreign_keys = ON")  # 启用外键支持
cursor = conn.cursor()

def createTables():
    # 会议室id，会议室名称，会议室楼层，会议室容量，会议室信息（json）
    cursor.execute('''CREATE TABLE IF NOT EXISTS meeting_room
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        floor INTEGER NOT NULL,
        capacity INTEGER NOT NULL,
        info TEXT NOT NULL)''')
    # 会议室预定id，会议室id，预定人id，预定开始时间，预定结束时间，预定日期
    cursor.execute('''CREATE TABLE IF NOT EXISTS booking
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        date TEXT NOT NULL,
        subject TEXT NOT NULL,
        FOREIGN KEY (room_id) REFERENCES meeting_room(id),
        FOREIGN KEY (user_id) REFERENCES users(id))''')
    conn.commit()

createTables()

def insertMeetingRoom(name, floor, capacity, info):
    cursor.execute("INSERT INTO meeting_room (name, floor, capacity, info) VALUES (?, ?, ?, ?)",
                    (name, floor, capacity, info))
    conn.commit()

def getroomname(room_id):
    try:
        lock_threading.acquire()
        cursor.execute("SELECT name FROM meeting_room WHERE id=?", (room_id,))
        return cursor.fetchone()[0]
    except sqlite3.Error as e:
        print(e)
        return None
    finally:
        lock_threading.release()

def getallrooms():
    # cursor.execute("SELECT * FROM meeting_room")
    # return cursor.fetchall()
    try:
        lock_threading.acquire()
        cursor.execute("SELECT * FROM meeting_room")
        return cursor.fetchall()
    except sqlite3.Error as e:
        print(e)
        return None
    finally:
        lock_threading.release()

def getallreservations(date):
    # cursor.execute("SELECT * FROM booking WHERE date=?", (date,))
    # return cursor.fetchall()
    try:
        lock_threading.acquire()
        cursor.execute("SELECT * FROM booking WHERE date=?", (date,))
        return cursor.fetchall()
    except sqlite3.Error as e:
        print(e)
        return None
    finally:
        lock_threading.release()

def getallreservationsbyroom(room_id, date):
    try:
        lock_threading.acquire()
        cursor.execute("SELECT * FROM booking WHERE room_id=? AND date=?", (room_id, date))
        return cursor.fetchall()
    except sqlite3.Error as e:
        print(e)
        return None
    finally:
        lock_threading.release()

def insertreservation(room_id, user_id, start_time, end_time, date, subject):
    try:
        lock_threading.acquire()
        cursor.execute("INSERT INTO booking (room_id, user_id, start_time, end_time, date, subject) VALUES (?, ?, ?, ?, ?, ?)",
                        (room_id, user_id, start_time, end_time, date, subject))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()

def getuserreservations(user_id):
    try:
        lock_threading.acquire()
        # cursor.execute("SELECT * FROM booking WHERE user_id=?", (user_id,))
        # 加上会议室名称
        cursor.execute("SELECT booking.*, meeting_room.name FROM booking JOIN meeting_room ON booking.room_id = meeting_room.id WHERE booking.user_id=?", (user_id,))
        return cursor.fetchall()
    except sqlite3.Error as e:
        print(e)
        return None
    finally:
        lock_threading.release()

def deletereservation(user_id, reservation_id):
    try:
        lock_threading.acquire()
        cursor.execute("DELETE FROM booking WHERE user_id=? AND id=?", (user_id, reservation_id))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()