from openai import OpenAI

class LLMInterface:
    def __init__(self):
        self.client = OpenAI(api_key="sk-f9e4937a7a7e4e31b823337fd6b9849c", base_url="https://api.deepseek.com")

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


# if __name__ == '__main__':
#     llm = LLMInterface()
#     response = llm.query("What is the capital of France?")
#     print(response)
