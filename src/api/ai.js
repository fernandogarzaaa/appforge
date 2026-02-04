/**
 * AI Code Generation API Endpoints
 * Handles OpenAI integration for code generation, explanation, and analysis
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/ai/generate-code
 * Generate code based on prompt and context
 */
export async function generateCode(req, res) {
  try {
    const { prompt, model = 'gpt-4', temperature = 0.7, maxTokens = 2000, language, type } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemPrompt = `You are an expert ${language} developer. Generate high-quality, production-ready code.
Requirements:
- Follow best practices and patterns
- Include inline comments
- Ensure code is secure and performant
- Provide 3 different implementations with trade-offs when applicable
Format responses with clear markdown sections.`;

    const response = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content || '';

    // Parse suggestions from response
    const suggestions = parseCodeSuggestions(content, language, type);

    res.json({
      success: true,
      suggestions,
      usage: {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens,
      },
      model: response.model,
      type,
    });
  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({
      error: 'Failed to generate code',
      message: error.message,
    });
  }
}

/**
 * POST /api/ai/explain-code
 * Explain existing code
 */
export async function explainCode(req, res) {
  try {
    const { code, language, detailLevel = 'comprehensive' } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const detailPrompt = {
      brief: 'Provide a brief 1-2 sentence explanation.',
      moderate: 'Provide a moderate explanation covering main functionality.',
      comprehensive: 'Provide a comprehensive explanation including purpose, logic flow, and potential improvements.',
    }[detailLevel] || '';

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.5,
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: `You are an expert code analyst. Explain code clearly and concisely.
Detail level: ${detailLevel}`,
        },
        {
          role: 'user',
          content: `Explain this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\n\n${detailPrompt}`,
        },
      ],
    });

    const explanation = response.choices[0]?.message?.content || '';

    res.json({
      success: true,
      explanation,
      language,
      detailLevel,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Code explanation error:', error);
    res.status(500).json({
      error: 'Failed to explain code',
      message: error.message,
    });
  }
}

/**
 * POST /api/ai/analyze-code
 * Analyze code for issues, performance, security
 */
export async function analyzeCode(req, res) {
  try {
    const { code, language, focusAreas = ['performance', 'security', 'readability'] } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const focusText = focusAreas.join(', ');

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.5,
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: `You are an expert code reviewer. Analyze code for: ${focusText}.
Provide structured feedback with specific suggestions for improvement.`,
        },
        {
          role: 'user',
          content: `Analyze this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``,
        },
      ],
    });

    const analysis = response.choices[0]?.message?.content || '';

    res.json({
      success: true,
      analysis,
      focusAreas,
      language,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Code analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze code',
      message: error.message,
    });
  }
}

/**
 * POST /api/ai/generate-tests
 * Generate unit tests for code
 */
export async function generateTests(req, res) {
  try {
    const { code, language, framework = 'jest', testType = 'unit' } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: `You are an expert test developer. Generate comprehensive ${testType} tests using ${framework}.
Include:
- Happy path tests
- Edge case tests
- Error handling tests
- Mock setup when needed`,
        },
        {
          role: 'user',
          content: `Generate tests for this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``,
        },
      ],
    });

    const tests = response.choices[0]?.message?.content || '';

    res.json({
      success: true,
      tests,
      language,
      framework,
      testType,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Test generation error:', error);
    res.status(500).json({
      error: 'Failed to generate tests',
      message: error.message,
    });
  }
}

/**
 * POST /api/ai/refactor-code
 * Refactor code for specified goal
 */
export async function refactorCode(req, res) {
  try {
    const { code, language, goal = 'performance and readability', constraints = [] } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const constraintsText = constraints.length > 0 ? `\nConstraints: ${constraints.join(', ')}` : '';

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: `You are an expert ${language} developer. Refactor code for ${goal}.
Provide refactored code with inline comments explaining changes.${constraintsText}`,
        },
        {
          role: 'user',
          content: `Refactor this ${language} code for ${goal}:\n\`\`\`${language}\n${code}\n\`\`\``,
        },
      ],
    });

    const refactored = response.choices[0]?.message?.content || '';

    res.json({
      success: true,
      refactored,
      language,
      goal,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Code refactoring error:', error);
    res.status(500).json({
      error: 'Failed to refactor code',
      message: error.message,
    });
  }
}

/**
 * Helper function to parse code suggestions from AI response
 */
function parseCodeSuggestions(content, language, type) {
  const suggestions = [];

  // Split by code blocks or numbered sections
  const blocks = content.split(/```[a-zA-Z]*\n/);

  for (let i = 1; i < blocks.length; i += 2) {
    const codeBlock = blocks[i].split('\n```')[0].trim();

    if (codeBlock) {
      suggestions.push({
        code: codeBlock,
        language,
        type,
        title: extractTitle(blocks[i - 1]),
        description: extractDescription(blocks[i - 1]),
      });
    }
  }

  // If no code blocks found, try to extract from numbered list
  if (suggestions.length === 0) {
    const numberPattern = /(\d+\.\s*)?```[\s\S]*?```/g;
    const matches = content.match(numberPattern) || [];

    matches.forEach((match) => {
      const codeMatch = match.match(/```[\s\S]*?```/);
      if (codeMatch) {
        const code = codeMatch[0].replace(/```[a-zA-Z]*/g, '').trim();
        suggestions.push({
          code,
          language,
          type,
        });
      }
    });
  }

  return suggestions.length > 0
    ? suggestions
    : [
        {
          code: content,
          language,
          type,
        },
      ];
}

/**
 * Helper to extract title from content
 */
function extractTitle(content) {
  const titleMatch = content.match(/^#{1,3}\s+(.+)/m);
  return titleMatch ? titleMatch[1].trim() : null;
}

/**
 * Helper to extract description
 */
function extractDescription(content) {
  const lines = content.split('\n').filter((line) => line.trim() && !line.startsWith('#'));
  return lines.slice(0, 2).join(' ').substring(0, 200);
}

export default {
  generateCode,
  explainCode,
  analyzeCode,
  generateTests,
  refactorCode,
};
