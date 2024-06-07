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
        if_captain INTEGER DEFAULT 0,
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
        cursor.execute('''INSERT INTO team_member (team_id, member_id, if_captain) VALUES (?, ?, ?)''', (cursor.lastrowid, captain_id, 1))
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
        print(team_id, member_id)
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
        
def get_user_teams_with_captain_flag(user_id):
    try:
        lock_threading.acquire()
        cursor.execute('''
            SELECT t.id, t.name, t.captain_id, 
            CASE WHEN t.captain_id = ? THEN 1 ELSE 0 END as is_captain
            FROM team_member tm
            JOIN team t ON tm.team_id = t.id
            WHERE tm.member_id = ?
            ORDER BY is_captain DESC
        ''', (user_id, user_id))
        return cursor.fetchall()
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()

def get_team_members_with_details(team_id):
    try:
        lock_threading.acquire()
        cursor.execute('''
            SELECT u.id, tm.if_captain
            FROM team_member tm
            JOIN users u ON tm.member_id = u.id
            WHERE tm.team_id = ?
        ''', (team_id,))
        return cursor.fetchall()
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()

def search_in_team_invitation(member_id):
    try:
        lock_threading.acquire()
        cursor.execute('''SELECT * FROM team_invitation WHERE member_id = ?''', (member_id,))
        return cursor.fetchall()
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()
        

