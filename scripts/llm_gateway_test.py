import requests

url = "http://localhost:8000/v1/chat/completions"

payload = {
    "messages": [
        {"role": "user", "content": "Hello, who are you?"}
    ],
    "model": "chimera-auto",
    "temperature": 0.7,
    "max_tokens": 128
}

try:
    r = requests.post(url, json=payload)
    print("Test response:", r.status_code, r.json())
except Exception as e:
    print("Test failed:", e)
