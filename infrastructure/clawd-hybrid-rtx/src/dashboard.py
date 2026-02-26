from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, JSONResponse
import datetime
import json
import os

router = APIRouter()

# HTML for dashboard (self-contained, no external deps)
DASHBOARD_HTML = '''
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Chimera Dashboard</title>
<style>
body { font-family: Arial, sans-serif; background: #f7f7fa; color: #222; margin: 0; padding: 0; }
#wrap { max-width: 1100px; margin: 30px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; padding: 32px; }
h1 { font-size: 2em; margin-bottom: 0.2em; }
table { border-collapse: collapse; width: 100%; margin-bottom: 2em; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
th { background: #f0f0f0; }
tr:nth-child(even) { background: #fafbfc; }
.status-healthy { color: #0a0; font-weight: bold; }
.status-cooldown { color: #e90; font-weight: bold; }
.status-degraded { color: #c00; font-weight: bold; }
#footer { color: #888; font-size: 0.9em; margin-top: 2em; }
</style>
</head>
<body>
<div id="wrap">
<h1>Chimera Quantum LLM Dashboard</h1>
<div id="stats"></div>
<div id="footer">Auto-refreshes every 10 seconds. &copy; Chimera Quantum</div>
</div>
<script>
async function fetchStats() {
  const r = await fetch('/dashboard/stats');
  const data = await r.json();
  let html = '';
  // Model Health Table
  html += '<h2>Model Health</h2>';
  html += '<table><tr><th>Model</th><th>Status</th><th>Success Rate</th><th>Avg Response Time (ms)</th><th>Call Count</th></tr>';
  for (const m of data.model_health) {
    html += `<tr><td>${m.name}</td><td class="status-${m.status}">${m.status}</td><td>${(m.success_rate*100).toFixed(1)}%</td><td>${m.avg_response_time}</td><td>${m.call_count}</td></tr>`;
  }
  html += '</table>';
  // Kimi Usage
  html += '<h2>Kimi Usage</h2>';
  html += `<p>Total Calls Today: <b>${data.kimi_usage.calls_today}</b> &nbsp; Estimated Tokens: <b>${data.kimi_usage.tokens_today}</b> &nbsp; Projected Monthly Cost: <b>$${data.kimi_usage.projected_monthly_cost.toFixed(2)}</b></p>`;
  // Semantic Cache
  html += '<h2>Semantic Cache</h2>';
  html += `<p>Total Entries: <b>${data.cache.total_entries}</b> &nbsp; Hit Rate: <b>${data.cache.hit_rate}%</b> &nbsp; Size: <b>${data.cache.size}</b></p>`;
  // Last 20 Requests
  html += '<h2>Last 20 Requests</h2>';
  html += '<table><tr><th>Timestamp</th><th>Model</th><th>Response Time (ms)</th><th>Cache</th><th>Status</th></tr>';
  for (const req of data.last_requests) {
    html += `<tr><td>${req.timestamp}</td><td>${req.model}</td><td>${req.response_time}</td><td>${req.cache}</td><td>${req.status}</td></tr>`;
  }
  html += '</table>';
  document.getElementById('stats').innerHTML = html;
}
fetchStats();
setInterval(fetchStats, 10000);
</script>
</body>
</html>
'''

@router.get("/dashboard", response_class=HTMLResponse)
def dashboard_page():
    return HTMLResponse(DASHBOARD_HTML)

@router.get("/dashboard/stats", response_class=JSONResponse)
def dashboard_stats(request: Request):
    # These will be filled in by chimera_server.py
    stats_func = request.app.state.dashboard_stats_func
    return JSONResponse(stats_func())
