# test_run_app.py
import unittest
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from run_app import app

class RunAppTestCase(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()

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

if __name__ == '__main__':
    unittest.main()