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
    # 笔记标题，，会议室楼层，会议室容量，会议室信息（json）
    cursor.execute('''CREATE TABLE IF NOT EXISTS notes
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
        TEXT NOT NULL)''')
    # 会议室预定id，会议室id，预定人id，预定开始时间，预定结束时间，预定日期
    cursor.execute('''CREATE TABLE IF NOT EXISTS booking
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        date TEXT NOT NULL,
        FOREIGN KEY (room_id) REFERENCES meeting_room(id),
        FOREIGN KEY (user_id) REFERENCES users(id))''')
    conn.commit()

createTables()