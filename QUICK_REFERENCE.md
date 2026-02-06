# 🚀 Quick Reference - Quantum LLM & Autonomous Bots

## ⚡ 5-Minute Setup

```bash
# 1. Get API keys (30 min)
OpenAI:     https://platform.openai.com/api-keys
Claude:     https://console.anthropic.com/
Gemini:     https://makersuite.google.com/app/apikey
Grok:       https://console.x.ai/

# 2. Install dependencies (1 min)
cd backend && npm install node-cron uuid

# 3. Configure .env (2 min)
nano backend/.env
# Add: OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, GROK_API_KEY
# Set: QUANTUM_DEFAULT_MODE=quantum

# 4. Start servers (2 min)
cd backend && npm run dev    # Terminal 1
npm run dev                  # Terminal 2

# 5. Test (5 min)
# Visit: http://localhost:5173/ai-assistant
# Select: ⚛️ Quantum AI
# Type: "Write a React button"
# Check: quantum metrics in response
```

---

## 📋 Essential Commands

### Create Bot (API)
```bash
curl -X POST http://localhost:5000/api/bots \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Bot","llm":{"model":"quantum"}}'
```

### Execute Bot
```bash
curl -X POST http://localhost:5000/api/bots/BOT_ID/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello bot!"}'
```

### Add Knowledge (RAG)
```bash
curl -X POST http://localhost:5000/api/bots/BOT_ID/knowledge \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Important info...","title":"Docs"}'
```

### Get Metrics
```bash
curl http://localhost:5000/api/bots/BOT_ID/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Key API Endpoints

```
# Bots
POST   /api/bots                  Create
GET    /api/bots                  List
GET    /api/bots/:id              Get
PUT    /api/bots/:id              Update
DELETE /api/bots/:id              Delete

# Execution
POST   /api/bots/:id/execute      Run bot
POST   /api/bots/:id/test         Test (no logs)
GET    /api/bots/:id/executions   History
GET    /api/bots/:id/metrics      Analytics

# Knowledge
POST   /api/bots/:id/knowledge    Add
GET    /api/bots/:id/knowledge    List
DELETE /api/bots/:id/knowledge/:k Delete

# Deployment
POST   /api/bots/:id/deploy       Deploy
POST   /api/bots/:id/undeploy     Undeploy
```

---

## 🤖 Bot Configuration Template

```json
{
  "name": "Customer Support Bot",
  "description": "Handles customer queries",
  "personality": {
    "systemPrompt": "You are a friendly support agent",
    "tone": "friendly",
    "style": "conversational",
    "temperature": 0.7
  },
  "llm": {
    "model": "quantum",
    "forceEnsemble": true,
    "taskType": "conversational"
  },
  "autonomous": {
    "enabled": true,
    "schedule": "0 */4 * * *",
    "maxExecutionsPerDay": 10
  }
}
```

---

## ⚛️ Quantum Metrics Guide

### Coherence (0-1)
- **> 0.85**: Models strongly agree ✅
- **0.65-0.85**: Moderate agreement ⚠️
- **< 0.65**: Disagreement - potential risk ⛔

### Entropy (0-1)
- **< 0.3**: Low diversity - high certainty ✅
- **0.3-0.5**: Medium diversity ⚠️
- **> 0.5**: High diversity - check carefully ⛔

### Confidence (0-1)
- **> 0.85**: Very confident ✅
- **0.7-0.85**: Moderately confident ⚠️
- **< 0.7**: Low confidence ⛔

### Hallucination Risk
- **LOW**: Trustworthy ✅
- **MEDIUM**: Verify if critical ⚠️
- **HIGH**: Response rejected ⛔

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| No LLM providers | Add `OPENAI_API_KEY` to `.env` |
| Quantum not enabled | Set `QUANTUM_DEFAULT_MODE=quantum` |
| Bot creation fails | Check MongoDB connected |
| Scheduler not starting | Install `node-cron`: `npm install node-cron` |
| High costs | Disable quantum or use fewer providers |
| Low coherence | Normal for ambiguous queries |

---

## 📊 Monitoring

### Check Logs
```bash
# Backend logs
tail -f backend/logs/app.log

# Watch for:
✓ "Quantum LLM mode: ENABLED"
✓ "Bot scheduler started"
✓ "Scheduled N autonomous bots"
```

### Check Database
```javascript
// MongoDB
db.bots.countDocuments({ isActive: true })
db.botexecutions.find().sort({ createdAt: -1 }).limit(10)
```

### Check Metrics
```bash
# Bot success rate
curl http://localhost:5000/api/bots/BOT_ID/metrics

# Quantum coherence
db.botexecutions.aggregate([
  { $group: {
    _id: null,
    avgCoherence: { $avg: '$llm.quantumMetrics.coherence' }
  }}
])
```

---

## 💰 Cost Reference

### Per Query:
- Single LLM: $0.001 - $0.03
- Quantum Ensemble: $0.01 - $0.06
- With RAG: Add 10-20%

### Monthly (Estimate):
- Testing: $20-50
- Production: $100-200
- Enterprise: $500-1000+

### Optimization:
- Use GPT-3.5 for simple queries
- Disable ensemble for testing
- Set daily execution limits
- Cache responses

---

## 🎯 Cron Schedule Examples

```
"*/5 * * * *"     Every 5 minutes
"0 * * * *"       Every hour
"0 */4 * * *"     Every 4 hours
"0 9 * * *"       9 AM daily
"0 9 * * 1"       9 AM Monday
"0 0 * * *"       Midnight daily
"0 9-17 * * 1-5"  9AM-5PM weekdays
```

---

## 🔑 Environment Variables

```env
# Required
OPENAI_API_KEY=sk-proj-...
QUANTUM_DEFAULT_MODE=quantum

# Recommended
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIzaSy...
GROK_API_KEY=...

# Optional
MONGODB_URI=mongodb://localhost:27017/appforge
PORT=5000
```

---

## 📚 Documentation Links

- **Full Implementation**: `IMPLEMENTATION_COMPLETE.md`
- **Step-by-Step Plan**: `MASTER_IMPLEMENTATION_PLAN.md`
- **Quantum Deep Dive**: `QUANTUM_LLM_SETUP.md`
- **Bot Integration**: `AUTONOMOUS_BOT_INTEGRATION.md`
- **API Keys Setup**: `AI_SETUP_GUIDE.md`

---

## ✅ Health Check

```bash
# Backend health
curl http://localhost:5000/health

# Quantum status
curl http://localhost:5000/api/base44/status

# Bot scheduler status
# Check logs for: "Bot scheduler started"
```

---

## 🎉 Success Indicators

- ✓ Backend logs: "Quantum LLM mode: ENABLED"
- ✓ All providers show "✓ Configured"
- ✓ Frontend shows "⚛️ Quantum AI" option
- ✓ Test query returns quantum metrics
- ✓ Coherence > 0.7, Confidence > 0.85
- ✓ Hallucination risk: LOW
- ✓ Bot scheduler started
- ✓ Bot execution completes successfully

---

**Quick Help**: Read `IMPLEMENTATION_COMPLETE.md` for full details

**Version**: 2.0.0 | **Date**: 2026-02-06 | **Status**: Production Ready ✅
