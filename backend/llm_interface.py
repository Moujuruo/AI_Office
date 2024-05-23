from openai import OpenAI

class LLMInterface:
    def __init__(self):
        self.client = OpenAI(api_key="sk-cc53ff4dfc9e4c08b44623fa1fc3a658", base_url="https://api.deepseek.com")

    def query(self, content, prefix_prompt="You are a helpful assistant"):
        response = self.client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": prefix_prompt},
                {"role": "user", "content": content},
            ],
            stream=False
        )
        return response.choices[0].message.content

