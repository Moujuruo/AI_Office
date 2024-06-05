from openai import OpenAI
import qianfan
import os

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
