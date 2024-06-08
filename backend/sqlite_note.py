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
    # 笔记标题，笔记内容，用户id
    cursor.execute('''CREATE TABLE IF NOT EXISTS notes
        (note_id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_title TEXT NOT NULL,
        note_content TEXT,
        importance TEXT NOT NULL,
        save_time TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id))''')
    conn.commit()


createTables()

def insertNote(note_title, note_content, user_id, importance, savetime):
    try:
        cursor.execute("INSERT INTO notes (note_title, note_content, user_id, importance, save_time) VALUES (?, ?, ?, ?, ?)", 
                        (note_title, note_content, user_id, importance, savetime))
        conn.commit()
        return {"status": 200, "message": "添加成功"}
    except Exception as e:
        return {"status": 500, "message": f"数据库错误: {e}"}

def updateNote(note_title, note_content, user_id, importance, savetime):
    try:
        cursor.execute("UPDATE notes SET note_content = ?, importance = ?, save_time = ? WHERE note_title = ? AND user_id = ?", 
                        (note_content, importance, savetime, note_title, user_id))
        conn.commit()
        return {"status": 200, "message": "更新成功"}
    except Exception as e:
        return {"status": 500, "message": f"数据库错误: {e}"}
    
def getNoteByTitle(note_title, user_id):
    cursor.execute("SELECT * FROM notes WHERE note_title = ? AND user_id = ?", (note_title, user_id))
    note = cursor.fetchone()
    if note is None:
        return False
    else: 
        return True
    
def getNoteTitleList(user_id):
    cursor.execute("SELECT note_title, importance, save_time FROM notes WHERE user_id = ?", (user_id,))
    notes = cursor.fetchall()
    return notes

def getNoteContent(userid, title):
    cursor.execute("SELECT note_content FROM notes WHERE user_id = ? AND note_title = ?", (userid, title))
    note = cursor.fetchone()
    return note

def deleteNoteByTitle(user_id, note_title):
    cursor.execute("DELETE FROM notes WHERE note_title = ? AND user_id = ?", (note_title, user_id))
    conn.commit()
    return