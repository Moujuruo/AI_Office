import hashlib
import sqlite3
import json
import csv
from sqlite3 import Error
import threading
import sqlite_roombooking as RB

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
    # 通知id，会议室id，用户id，预定开始时间，预定结束时间，预定日期
    cursor.execute('''CREATE TABLE IF NOT EXISTS meeting_room_reservation
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        room_name TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        reserve_user_id INTEGER NOT NULL,
        reserve_user_name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        date TEXT NOT NULL,
        subject TEXT NOT NULL,
        team_id INTEGER,
        team_name TEXT,
        type INTEGER DEFAULT 0,
        FOREIGN KEY (room_id) REFERENCES meeting_room(id),
        FOREIGN KEY (user_id) REFERENCES users(id))'''
    )
    
    conn.commit()

createTables()

def insertMeetingRoomReservation(room_id, user_id, reserve_user_id, start_time, end_time, date, subject, team_id, type=0):
    try:
        lock_threading.acquire()
        # 先拿team_id对应的team_name
        cursor.execute('''SELECT name FROM team WHERE id = ?''', (team_id,))
        team_name = cursor.fetchone()[0]
        cursor.execute('''SELECT username FROM users WHERE id = ?''', (reserve_user_id,))
        reserve_user_name = cursor.fetchone()[0]
        cursor.execute('''INSERT INTO meeting_room_reservation (room_id, room_name, user_id, reserve_user_id, reserve_user_name, start_time, end_time, date, subject, team_id, team_name, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', (room_id, RB.getroomname(room_id), user_id, reserve_user_id, reserve_user_name, start_time, end_time, date, subject, team_id, team_name, type))
        
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()

def getMeetingRoomReservation(user_id):
    try:
        lock_threading.acquire()
        cursor.execute('''SELECT * FROM meeting_room_reservation WHERE user_id = ?''', (user_id,))
        return cursor.fetchall()
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()

def deleteMeetingRoomReservation(reservation_id, user_id, type):
    try:
        lock_threading.acquire()
        print(reservation_id, user_id, type)
        cursor.execute('''DELETE FROM meeting_room_reservation WHERE id = ? AND user_id = ? AND type = ?''', (reservation_id, user_id, type))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()


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

def get_team_captain(team_id):
    try:
        lock_threading.acquire()
        cursor.execute('''SELECT captain_id FROM team WHERE id = ? ''', (team_id,))
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
            SELECT u.id, tm.if_captain, u.username
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
        
def delete_team(team_id):
    try:
        lock_threading.acquire()
        # 先删 team_member
        cursor.execute('''DELETE FROM team_member WHERE team_id = ?''', (team_id,))
        conn.commit()
        # 再删 team_invitation
        cursor.execute('''DELETE FROM team_invitation WHERE team_id = ?''', (team_id,))
        conn.commit()
        # 最后删 team
        cursor.execute('''DELETE FROM team WHERE id = ?''', (team_id,))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()

def get_captain_teams(captain_id):
    try:
        lock_threading.acquire()
        cursor.execute('''SELECT * FROM team WHERE captain_id = ?''', (captain_id,))
        return cursor.fetchall()
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()

def change_team_name(team_id, new_name):
    try:
        lock_threading.acquire()
        cursor.execute('''UPDATE team SET name = ? WHERE id = ?''', (new_name, team_id))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(e)
        return False
    finally:
        lock_threading.release()
