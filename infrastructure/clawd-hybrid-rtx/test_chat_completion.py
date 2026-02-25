import requests

url = "http://127.0.0.1:8000/v1/chat/completions"
payload = {
    "model": "chimera-quantum",
    "messages": [
        {"role": "user", "content": "What is quantum superposition?"}
    ]
}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)
print("Status Code:", response.status_code)
try:
    print("Response JSON:", response.json())
except Exception:
    print("Response Text:", response.text)
