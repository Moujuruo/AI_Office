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
    # 团队id，团队名称，队长id
    cursor.execute('''CREATE TABLE IF NOT EXISTS team
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        captain_id INTEGER NOT NULL)''')
    # 成员隶属团队id，成员id
    cursor.execute('''CREATE TABLE IF NOT EXISTS team_member
        (team_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        PRIMARY KEY (team_id, member_id),
        FOREIGN KEY (team_id) REFERENCES team(id),
        FOREIGN KEY (member_id) REFERENCES users(id))''')
    # 等待接受邀请的团队id，成员id
    cursor.execute('''CREATE TABLE IF NOT EXISTS team_invitation
        (team_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        PRIMARY KEY (team_id, member_id),
        FOREIGN KEY (team_id) REFERENCES team(id),
        FOREIGN KEY (member_id) REFERENCES users(id))''')
    
    conn.commit()

createTables()

def insertTeam(team_name, captain_id):
    try:
        lock_threading.acquire()
        cursor.execute('''INSERT INTO team (name, captain_id) VALUES (?, ?)''', (team_name, captain_id))
        conn.commit()
    # 隶属表插入队长
        cursor.execute('''INSERT INTO team_member (team_id, member_id) VALUES (?, ?)''', (cursor.lastrowid, captain_id))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()

def insertTeamInvitation(team_id, member_id):
    try:
        lock_threading.acquire()
        cursor.execute('''INSERT INTO team_invitation (team_id, member_id) VALUES (?, ?)''', (team_id, member_id))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()

def deleteTeamInvitation(team_id, member_id):
    try:
        lock_threading.acquire()
        cursor.execute('''DELETE FROM team_invitation WHERE team_id = ? AND member_id = ?''', (team_id, member_id))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()

def insertTeamMember(team_id, member_id):
    try:
        lock_threading.acquire()
        cursor.execute('''INSERT INTO team_member (team_id, member_id) VALUES (?, ?)''', (team_id, member_id))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()

def deleteTeamMember(team_id, member_id):
    try:
        lock_threading.acquire()
        cursor.execute('''DELETE FROM team_member WHERE team_id = ? AND member_id = ?''', (team_id, member_id))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()

def get_user_teams(user_id):
    try:
        lock_threading.acquire()
        cursor.execute('''SELECT team_id FROM team_member WHERE member_id = ?''', (user_id,))
        return cursor.fetchall()
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()

def get_team_members(team_id):
    try:
        lock_threading.acquire()
        cursor.execute('''SELECT member_id FROM team_member WHERE team_id = ?''', (team_id,))
        return cursor.fetchall()
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()

def get_team_info(team_id):
    try:
        lock_threading.acquire()
        cursor.execute('''SELECT * FROM team WHERE team_id = ?''', (team_id,))
        return cursor.fetchone()
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()
