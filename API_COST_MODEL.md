# API Cost Model - Important Notes

## BYOK (Bring Your Own Key) Strategy

### For Production Swarm Product

**Recommended Pricing Model:**

1. **Indie Tier ($19/mo):**
   - User provides their own Gemini/OpenAI API key
   - Zero AI costs for you (the seller)
   - User pays Google/OpenAI directly for AI usage
   - You charge for the swarm orchestration only

2. **Pro Tier ($99/mo):**
   - You bundle AI access (include API costs)
   - Estimate ~$10-20/user/month for AI
   - Profit margin: $79-89/mo per user

3. **Enterprise Tier ($500/mo):**
   - You provide unlimited AI access
   - Premium support included
   - Higher margin covers AI infrastructure

### Configuration Example

```json
// VS Code settings.json
{
  "autonomousSwarm.apiMode": "byok", // or "bundled"
  "autonomousSwarm.gemini.apiKey": "user-key-here",
  "autonomousSwarm.openai.apiKey": "optional-fallback"
}
```

### Why BYOK for Indie Tier?

- ✅ You don't pay AI costs at scale
- ✅ User has control over spending
- ✅ Many users already have free Gemini tier
- ✅ Clear cost separation (swarm = $19, AI = user's existing cost)
- ✅ Scales profitably

### Implementation Note

Current swarm uses Antigravity (me) via quantum channel. For production:
- Add API key configuration in VS Code extension
- Swarm calls user's LLM directly (if BYOK mode)
- Or calls your LLM pool (if bundled mode)

**Oracle Verdict:** BYOK for mass market, bundled for premium tiers.
