# test_run_app.py
import unittest
import os
import sys
import json
import sqlite3  # 确保导入sqlite3库
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from run_app import app

class RunAppTestCase(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        

    # def create_meeting_room_table(self):
    #     conn = sqlite3.connect('Ai_work.db', timeout=10)
    #     cursor = conn.cursor()
    #     try:
    #         cursor.execute('''
    #             CREATE TABLE IF NOT EXISTS meeting_room (
    #                 id INTEGER PRIMARY KEY AUTOINCREMENT,
    #                 name TEXT NOT NULL,
    #                 floor INTEGER NOT NULL,
    #                 capacity INTEGER NOT NULL,
    #                 info TEXT NOT NULL
    #             )
    #         ''')
    #         conn.commit()
    #     finally:
    #         conn.close()

    # def insert_test_room(self):
    #     conn = sqlite3.connect('Ai_work.db', timeout=10)
    #     cursor = conn.cursor()
    #     try:
    #         # 先删除已有的测试会议室记录，以防止插入时发生冲突
    #         cursor.execute("DELETE FROM meeting_room WHERE id=?", (1,))
    #         cursor.execute('''INSERT INTO meeting_room (id, name, floor, capacity, info)
    #                         VALUES (?, ?, ?, ?, ?)''', 
    #                         (1, "Test Room", 1, 10, "Test Room Info"))
    #         conn.commit()
    #     finally:
    #         conn.close()
        

    def test_0_hi(self):
        response = self.app.get('/hi')
        self.assertEqual(response.data, b'hi~')
        self.assertEqual(response.status_code, 200)

    def test_1_register(self):
        response = self.app.post('/api/v1/register', json={
            'username': 'unittest_user',
            'password': 'unittest_password',
            'gender': 'male'
        })
        self.assertTrue(response.status_code in [200, 400])
        self.assertTrue(response.get_json()['status'] in [200, 400])

    def test_2_login(self):
        response = self.app.post('/api/v1/login', json={
            'username': 'unittest_user',
            'password': 'unittest_password'
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['status'], 200)
        
    def test_3_add_activity(self):
        response = self.app.post('/api/v1/updateActivity', json={
            'ActivityName': 'Test Activity',
            'ActivityBeginDate': '2023-01-01',
            'ActivityBeginTime': '10:00:00',
            'ActivityEndDate': '2023-01-01',
            'ActivityEndTime': '12:00:00',
            'UserID': '1',  # 假设用户ID为1
        })
        self.assertEqual(response.status_code, 200)
        response_data = response.data
        response_json = json.loads(response_data)
        self.assertIn(response_json['code'], [0, 1], "Code should be 0 or 1")

        
    def test_4_list_activities(self):
        response = self.app.get('/api/v1/getActivityList/1')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIsInstance(response_data, list)
        # 遍历列表中的每个活动，检查UserID是否为1
        for item in response_data:
            # 假设每个条目的第一个元素是UserID
            self.assertEqual(item['UserID'], 1, "UserID should be 1")
             
    def test_5_delete_activity(self):
        response = self.app.delete('/api/v1/deleteActivity/1')
        self.assertEqual(response.status_code, 200)

    def test_6_create_item(self):
        response = self.app.post('/api/v1/updateItem', json={
            'ActivityID': 1,  # 假设活动ID为1
            'UserID': 1,  # 假设用户ID为1
            'ItemContent': 'Test Item',
            'ItemLevel': 0,
            'ItemStatus': 0,
            'ongoing_time': '2023-01-01 10:00:00',
            'finsh_time': '2023-01-01 12:00:00',
            'Status': 0,
            
        })
        self.assertEqual(response.status_code, 200)
        response_data = response.data
        response_json = json.loads(response_data)
        self.assertIn(response_json['code'], [0, 1], "Code should be 0 or 1")

    def test_7_list_items_by_activity(self):
        # 假设活动ID为1
        response = self.app.get('/api/v1/getItemListByActivity/1')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIsInstance(response_data, list)
        # 遍历列表中的每个活动，检查UserID是否为1
        for item in response_data:
            # 假设每个条目的第一个元素是UserID
            self.assertEqual(item['ActivityID'], 1, "ActivityID should be 1")

    def test_8_delete_item(self):
        # 假设事项ID为1
        response = self.app.delete('/api/v1/deleteItem/1')
        self.assertEqual(response.status_code, 200)
        
    def test_9_get_all_rooms(self):
        response = self.app.post('/api/v1/getAllRooms')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['code'], 0)
        self.assertTrue('data' in data)

    # def test_10_insert_and_delete_reservation(self):
        
    #     # 插入预约
    #     insert_data = {
    #         "room_id": 1,
    #         "user_id": 1,
    #         "start_time": "09:00",
    #         "end_time": "10:00",
    #         "date": "2024-04-01",
    #         "subject": "测试会议"
    #     }
    #     insert_response = self.app.post('/api/v1/insertReservation', json=insert_data)
    #     self.assertEqual(insert_response.status_code, 200)
    #     insert_result = json.loads(insert_response.data)
    #     self.assertEqual(insert_result['code'], 0)

    #     # 检查是否能获取到该预约
    #     user_id = 1
    #     get_response = self.app.post('/api/v1/getUserReservations', json={"user_id": user_id})
    #     self.assertEqual(get_response.status_code, 200)
    #     data = get_response.get_json()
    #     self.assertEqual(data['code'], 0)
    #     reservations = data['data']
    #     found = any(reservation['subject'] == "测试会议" for reservation in reservations)
    #     self.assertTrue(found)
        
        
    #      # 删除预约
    #     reservation_id = next(reservation['id'] for reservation in reservations if reservation['subject'] == "测试会议")
    #     delete_response = self.app.delete(f'/api/v1/deleteReservation/{reservation_id}')
    #     self.assertEqual(delete_response.status_code, 200)
    #     delete_data = delete_response.get_json()
    #     self.assertEqual(delete_data['code'], 0) 
        
    # def test_11_get_user_reservations(self):
    #     user_id = "1"
    #     response = self.app.post('/api/v1/getUserReservations', json={"user_id": user_id})
    #     self.assertEqual(response.status_code, 200)
    #     data = json.loads(response.data)
    #     self.assertEqual(data['code'], 0)
    #     # 检查返回的预约列表是否包含之前添加的预约
    #     reservations = data['data']
    #     print(reservations)
    #     found = any(reservation['subject'] == "测试会议" for reservation in reservations)
    #     self.assertTrue(found)
        
    # def test_12_get_user_reservations(self):
    #     user_id = "1"
    #     response = self.app.post('/api/v1/getUserReservations', json={"user_id": user_id})
    #     self.assertEqual(response.status_code, 200)
    #     data = json.loads(response.data)
    #     self.assertEqual(data['code'], 0)
    #     # 检查返回的预约列表是否包含之前添加的预约
    #     reservations = data['data']
    #     found = any(reservation['subject'] == "测试会议" for reservation in reservations)
    #     self.assertTrue(found)
        
    
if __name__ == '__main__':
    unittest.main()