import requests

url = "http://localhost:8000/health"
try:
    r = requests.get(url)
    print("Healthcheck:", r.status_code, r.json())
except Exception as e:
    print("Healthcheck failed:", e)
