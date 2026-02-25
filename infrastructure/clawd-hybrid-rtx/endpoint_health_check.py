import requests

ENDPOINTS = [
    ("/health", "GET"),
    ("/v1/local_models", "GET"),
    ("/v1/endpoints", "GET"),
    ("/v1/blueprint_clusters", "GET"),
    ("/v1/insights", "GET"),
    ("/v1/discovered_models", "GET"),
    ("/v1/chat/completions", "POST", {
        "model": "chimera-quantum",
        "messages": [{"role": "user", "content": "Test health check."}]
    }),
]

BASE_URL = "http://127.0.0.1:8000"

for endpoint in ENDPOINTS:
    url = BASE_URL + endpoint[0]
    method = endpoint[1]
    print(f"\nTesting {method} {url}")
    try:
        if method == "GET":
            resp = requests.get(url, timeout=10)
        elif method == "POST":
            resp = requests.post(url, json=endpoint[2], timeout=15)
        else:
            print(f"Unsupported method: {method}")
            continue
        print(f"Status: {resp.status_code}")
        try:
            print("Response:", resp.json())
        except Exception:
            print("Raw Response:", resp.text)
    except Exception as e:
        print(f"Error: {e}")
