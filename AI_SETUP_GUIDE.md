# AI Assistant Setup Guide

## Overview
The AI Assistant feature in AppForge uses OpenAI's GPT models to provide intelligent code assistance. This guide will help you set up the AI features.

## Prerequisites
- An OpenAI API account (sign up at https://platform.openai.com/)
- An API key from OpenAI

## Setup Steps

### 1. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. **Important**: Save this key securely - you won't be able to see it again!

### 2. Configure Backend Environment

1. Open the file: `backend/.env`
2. Find the line that says `OPENAI_API_KEY=your-openai-api-key-here`
3. Replace `your-openai-api-key-here` with your actual OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 3. Choose Your AI Model (Optional)

By default, the system uses `gpt-4` for complex queries and `gpt-3.5-turbo` for simpler ones. You can change this in `backend/.env`:

```env
OPENAI_MODEL=gpt-4           # Default model for AI Assistant
```

**Model Options:**
- `gpt-4` - Most capable, best for complex tasks (higher cost)
- `gpt-3.5-turbo` - Fast and economical, good for most tasks
- `gpt-4-turbo-preview` - Latest GPT-4 with better performance

### 4. Restart the Backend Server

After updating the `.env` file, restart your backend server for changes to take effect:

```bash
cd backend
npm run dev
```

Or if you're using the deployment script:
```bash
# On Windows
deploy.bat

# On Linux/Mac
./deploy.sh
```

## Testing the AI Assistant

1. Start both frontend and backend servers
2. Navigate to the AI Assistant page in your app
3. Type a prompt like "Hello, can you help me?"
4. You should receive a response from the AI

## Features Available

Once configured, the AI Assistant can:

- **Generate Code**: Create functions, components, or complete features
- **Explain Code**: Analyze and explain existing code
- **Debug Issues**: Help troubleshoot errors and bugs
- **Refactor**: Suggest improvements and optimize code
- **Code Review**: Provide feedback on code quality and best practices

## Supported Models in the Interface

The frontend displays several AI models:
- **GPT-4 Turbo** - Best for code generation & debugging
- **Claude 3 Opus** - Best for reasoning & analysis (currently mapped to GPT-4)
- **Gemini Pro** - Best for multimodal tasks (currently mapped to GPT-3.5)
- **Base44 LLM** - Built-in free model (uses GPT-3.5-turbo)

> **Note**: Currently, all models route through OpenAI. Claude and Gemini support can be added by configuring their respective API keys.

## Cost Management

### OpenAI Pricing (as of 2024)
- **GPT-4**: ~$0.03 per 1K tokens (input) / $0.06 per 1K tokens (output)
- **GPT-3.5-turbo**: ~$0.0005 per 1K tokens (input) / $0.0015 per 1K tokens (output)

### Tips to Reduce Costs
1. Use `gpt-3.5-turbo` for simple queries
2. Keep prompts concise
3. Set reasonable `maxTokens` limits
4. Monitor usage in OpenAI dashboard
5. Set up usage limits in your OpenAI account

## Troubleshooting

### Issue: "AI Assistant not responding"
**Solutions:**
- Check that `OPENAI_API_KEY` is set in `backend/.env`
- Verify your OpenAI API key is valid
- Ensure backend server is running
- Check backend console for error messages
- Verify you have credits in your OpenAI account

### Issue: "Invalid OpenAI API key"
**Solutions:**
- Double-check you copied the entire API key (starts with `sk-`)
- Ensure there are no extra spaces in the `.env` file
- Verify the key hasn't been revoked in OpenAI dashboard

### Issue: "OpenAI rate limit exceeded"
**Solutions:**
- Wait a few minutes and try again
- Upgrade your OpenAI account tier
- Implement request throttling in your app

### Issue: "Insufficient credits"
**Solutions:**
- Add payment method to your OpenAI account
- Check billing settings at https://platform.openai.com/account/billing

## Advanced Configuration

### Adding Claude Support (Optional)

To add Anthropic Claude support:

1. Get an API key from https://console.anthropic.com/
2. Add to `backend/.env`:
   ```env
   ANTHROPIC_API_KEY=your-anthropic-api-key-here
   ```
3. Update `backend/src/services/base44Service.js` to handle Claude API calls

### Adding Gemini Support (Optional)

To add Google Gemini support:

1. Get an API key from https://makersuite.google.com/app/apikey
2. Add to `backend/.env`:
   ```env
   GOOGLE_AI_API_KEY=your-google-ai-api-key-here
   ```
3. Update `backend/src/services/base44Service.js` to handle Gemini API calls

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use environment variables** in production (not `.env` files)
3. **Rotate API keys** regularly
4. **Set up usage alerts** in OpenAI dashboard
5. **Implement rate limiting** on your backend
6. **Validate user input** before sending to AI

## Monitoring Usage

### Backend Logging
The backend logs all AI requests:
```
[Base44Service] Calling OpenAI LLM: gpt-4 (requested: chatgpt)
```

### OpenAI Dashboard
Monitor your usage at: https://platform.openai.com/usage

### Database Tracking
AI usage is tracked in the `UserCredits` model:
- Token consumption per user
- Cost calculation
- Request history (last 100 requests)

## Need Help?

If you encounter issues:
1. Check the backend console for error messages
2. Review the browser console for frontend errors
3. Verify your API key at https://platform.openai.com/api-keys
4. Check OpenAI status at https://status.openai.com/

## Next Steps

Once AI is working:
1. Explore the AI Assistant features
2. Customize system prompts for your use case
3. Integrate AI into your workflows
4. Build custom AI-powered features
5. Monitor and optimize costs

---

**Last Updated**: 2026-02-06
**Version**: 1.0.0
