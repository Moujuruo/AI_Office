import json
from openai import OpenAI
import qianfan
import os

import requests

class LLMInterface:
    def __init__(self):
        # self.client = OpenAI(api_key="sk-f9e4937a7a7e4e31b823337fd6b9849c", base_url="https://api.deepseek.com")
        self.client = OpenAI(api_key="sk-5463b0a9d2194f7c855957899850a5f3", base_url="https://dashscope.aliyuncs.com/compatible-mode/v1")

    def query(self, content, prefix_prompt="You are a helpful assistant"):
        response = self.client.chat.completions.create(
            model="qwen-plus",
            messages=[
                {"role": "system", "content": prefix_prompt},
                {"role": "user", "content": content},
            ],
            stream=False
        )
        return response.choices[0].message.content
    
class MiniMax:
    def __init__(self):
        self.url = "https://api.minimax.chat/v1/text/chatcompletion_v2"
        self.api_key = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiLkvZXmoKnmmZ8iLCJVc2VyTmFtZSI6IuS9leagqeaZnyIsIkFjY291bnQiOiIiLCJTdWJqZWN0SUQiOiIxODA1ODk3NjA5NDA4MTU1NjU3IiwiUGhvbmUiOiIxODA1MDIxNzY1MCIsIkdyb3VwSUQiOiIxODA1ODk3NjA5Mzk5NzY3MDQ5IiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiIiwiQ3JlYXRlVGltZSI6IjIwMjQtMDYtMjYgMjA6NTM6MzciLCJpc3MiOiJtaW5pbWF4In0.NopkGobcWVfcDUe88a1czroqv61dscmycEfsPTrKfuHeOi-kDDWQpf0avTe3P6rXSm7ByTlB47KSTMqbM4Kn7sdU6fFS5UT2a7hcYsbouMznEfaY_jE_h8DgSqS3_2NBeNylLTdUYjSzdoauuP5iP-jXjNyi7Af85mhtgPqJxw_g75bsp07AmZR_UOzNxetLX3UbFx1e7y6yDlEyMtLwuO6SdeL4k5Vj0gou_NDwQWRMWLzXGRXTDILB-6h6mfSDm6y0TClvTLLsmFJqJBL2b2xbuyBB9EZ1uJjOWdMtK4DgyXoGB5x5C5LHWe-KasZQn00oR7lyBTJMcfLhlCnn6g"
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

    def query(self, content, prefix_prompt="You are a helpful assistant"):
        payload = json.dumps({
            "model": "abab6.5s-chat",
            "messages": [
                {
                    "role": "system",
                    "content": prefix_prompt
                },
                {
                    "role": "user",
                    "content": content
                }
            ],
            "tools": [
                {"type": "web_search"}
            ],
            "tool_choice": "none",
            "stream": False,
            "max_tokens": 8000,
        })

        response = requests.post(self.url, headers=self.headers, data=payload)
        # response = requests.request("POST", self.url, headers=self.headers, data=payload)
        # return response.text['choices'][0]['message']['content']
        print(response.text)
        if response.status_code == 200:
            result = response.json()
            return result['choices'][0]['message']['content']
        else:
            return f"Error: {response.status_code}, {response.text}"
    
class Qianfan:
    def __init__(self):
        os.environ["QIANFAN_AK"] = "vtPcz76K1MFyHQNPKH2WG27e"
        os.environ["QIANFAN_SK"] = "YHFqG6SbYnGS834XiQxtpbQDZI8tVPvn"

    def query(self, content):
        chat_comp = qianfan.ChatCompletion()
        resp = chat_comp.do(
            model="ERNIE-Lite-8K",
            messages=[{"role": "user", "content": content}],
            
        )
        return resp["body"]["result"]



# if __name__ == '__main__':
#     llm = LLMInterface()
#     response = llm.query("What is the capital of France?")
#     print(response)
