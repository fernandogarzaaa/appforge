import requests

url = "http://127.0.0.1:7860/v1/chat/completions"
payload = {
    "model": "clawd-hybrid-rtx",
    "messages": [{"role": "user", "content": "What is quantum computing?"}]
}
try:
    response = requests.post(url, json=payload, timeout=30)
    print(f"Status code: {response.status_code}")
    try:
        print("Response JSON:")
        print(response.json())
    except Exception as e:
        print(f"Error decoding JSON: {e}")
        print("Raw response:")
        print(response.text)
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
