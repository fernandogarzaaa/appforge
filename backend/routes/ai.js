const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const { validate, sanitizeInput } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { verifyToken } = require('../middleware/auth');
const db = require('../db/connection');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4';

// Middleware: Authentication required for all AI endpoints
router.use(verifyToken);

/**
 * POST /api/ai/generate-code
 * Generate code based on description and language
 */
router.post(
  '/generate-code',
  validate('generateCode'),
  asyncHandler(async (req, res) => {
    const { description, language, complexity } = req.validatedBody;
    const userId = req.user.id;
    const requestId = uuidv4();

    try {
      logger.info('Code generation requested', {
        userId,
        requestId,
        language,
        complexity,
      });

      const systemPrompt = `You are an expert code generator. Generate clean, well-commented, production-ready code.
Language: ${language}
Complexity: ${complexity || 'moderate'}
Return ONLY valid code with appropriate comments. No markdown, no explanations.`;

      const message = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: sanitizeInput(description),
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const generatedCode = message.choices[0].message.content;

      // Save to database for audit trail
      await db.query(
        `INSERT INTO ai_requests 
         (user_id, request_id, request_type, language, status, result, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, requestId, 'generate_code', language, 'success', generatedCode]
      );

      logger.info('Code generation successful', { userId, requestId });

      res.json({
        success: true,
        requestId,
        code: generatedCode,
        language,
        tokens: {
          input: message.usage.prompt_tokens,
          output: message.usage.completion_tokens,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Code generation failed', {
        userId,
        requestId,
        error: err.message,
      });

      await db.query(
        `INSERT INTO ai_requests 
         (user_id, request_id, request_type, language, status, error, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, requestId, 'generate_code', language, 'failed', err.message]
      );

      throw err;
    }
  })
);

/**
 * POST /api/ai/explain-code
 * Provide detailed explanation of code
 */
router.post(
  '/explain-code',
  validate('explainCode'),
  asyncHandler(async (req, res) => {
    const { code, language, depth } = req.validatedBody;
    const userId = req.user.id;
    const requestId = uuidv4();

    try {
      logger.info('Code explanation requested', {
        userId,
        requestId,
        language,
        depth,
      });

      const depthLevel = {
        basic: 'Provide a concise 2-3 sentence summary',
        intermediate: 'Provide detailed explanation covering main logic and structure',
        advanced: 'Provide comprehensive analysis including edge cases and performance implications',
      }[depth || 'intermediate'];

      const message = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert code explainer for ${language}.
${depthLevel}.
Format your response with clear sections: Overview, Logic Flow, Key Components, Potential Issues.`,
          },
          {
            role: 'user',
            content: `Explain this ${language} code:\n\n${sanitizeInput(code)}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      });

      const explanation = message.choices[0].message.content;

      await db.query(
        `INSERT INTO ai_requests 
         (user_id, request_id, request_type, language, status, result, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, requestId, 'explain_code', language, 'success', explanation]
      );

      logger.info('Code explanation successful', { userId, requestId });

      res.json({
        success: true,
        requestId,
        explanation,
        language,
        depth: depth || 'intermediate',
        tokens: {
          input: message.usage.prompt_tokens,
          output: message.usage.completion_tokens,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Code explanation failed', {
        userId,
        requestId,
        error: err.message,
      });

      await db.query(
        `INSERT INTO ai_requests 
         (user_id, request_id, request_type, language, status, error, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, requestId, 'explain_code', language, 'failed', err.message]
      );

      throw err;
    }
  })
);

/**
 * POST /api/ai/analyze-code
 * Perform code analysis (performance, security, quality)
 */
router.post(
  '/analyze-code',
  validate('analyzeCode'),
  asyncHandler(async (req, res) => {
    const { code, language, analysisType } = req.validatedBody;
    const userId = req.user.id;
    const requestId = uuidv4();

    try {
      logger.info('Code analysis requested', {
        userId,
        requestId,
        language,
        analysisType,
      });

      const analysisPrompt = {
        security: 'Analyze for security vulnerabilities, data exposure, and injection risks',
        performance: 'Analyze for performance bottlenecks, inefficient algorithms, and optimization opportunities',
        quality: 'Analyze for code quality issues, best practices, and maintainability',
        all: 'Perform comprehensive analysis covering security, performance, and code quality',
      }[analysisType || 'all'];

      const message = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert code analyzer for ${language}.
${analysisPrompt}.
Return analysis in JSON format with fields: issues (array), severity (high/medium/low), recommendations (array), score (0-100).`,
          },
          {
            role: 'user',
            content: `Analyze this ${language} code:\n\n${sanitizeInput(code)}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      let analysis;
      const responseText = message.choices[0].message.content;
      
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: responseText };
      } catch {
        analysis = { raw: responseText };
      }

      await db.query(
        `INSERT INTO ai_requests 
         (user_id, request_id, request_type, language, status, result, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, requestId, 'analyze_code', language, 'success', JSON.stringify(analysis)]
      );

      logger.info('Code analysis successful', { userId, requestId });

      res.json({
        success: true,
        requestId,
        analysis,
        language,
        analysisType: analysisType || 'all',
        tokens: {
          input: message.usage.prompt_tokens,
          output: message.usage.completion_tokens,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Code analysis failed', {
        userId,
        requestId,
        error: err.message,
      });

      await db.query(
        `INSERT INTO ai_requests 
         (user_id, request_id, request_type, language, status, error, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, requestId, 'analyze_code', language, 'failed', err.message]
      );

      throw err;
    }
  })
);

/**
 * POST /api/ai/generate-tests
 * Generate unit/integration tests for code
 */
router.post(
  '/generate-tests',
  validate('generateTests'),
  asyncHandler(async (req, res) => {
    const { code, language, testFramework, coverage } = req.validatedBody;
    const userId = req.user.id;
    const requestId = uuidv4();

    try {
      logger.info('Test generation requested', {
        userId,
        requestId,
        language,
        testFramework,
        coverage,
      });

      const frameworkHint = testFramework ? ` Use ${testFramework}.` : '';
      const coverageLevel = coverage === 'comprehensive' 
        ? 'Aim for >90% code coverage' 
        : 'Aim for >70% code coverage';

      const message = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert test engineer for ${language}.
Generate production-quality unit and integration tests.${frameworkHint}
${coverageLevel}.
Return ONLY valid test code with no markdown or explanations.`,
          },
          {
            role: 'user',
            content: `Generate tests for this ${language} code:\n\n${sanitizeInput(code)}`,
          },
        ],
        temperature: 0.6,
        max_tokens: 2000,
      });

      const testCode = message.choices[0].message.content;

      await db.query(
        `INSERT INTO ai_requests 
         (user_id, request_id, request_type, language, status, result, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, requestId, 'generate_tests', language, 'success', testCode]
      );

      logger.info('Test generation successful', { userId, requestId });

      res.json({
        success: true,
        requestId,
        tests: testCode,
        language,
        framework: testFramework || 'default',
        coverage: coverage || 'basic',
        tokens: {
          input: message.usage.prompt_tokens,
          output: message.usage.completion_tokens,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Test generation failed', {
        userId,
        requestId,
        error: err.message,
      });

      await db.query(
        `INSERT INTO ai_requests 
         (user_id, request_id, request_type, language, status, error, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, requestId, 'generate_tests', language, 'failed', err.message]
      );

      throw err;
    }
  })
);

/**
 * POST /api/ai/refactor-code
 * Refactor code for improvements (performance, readability, etc.)
 */
router.post(
  '/refactor-code',
  validate('refactorCode'),
  asyncHandler(async (req, res) => {
    const { code, language, targetVersion, goals } = req.validatedBody;
    const userId = req.user.id;
    const requestId = uuidv4();

    try {
      logger.info('Code refactoring requested', {
        userId,
        requestId,
        language,
        targetVersion,
        goals,
      });

      const versionHint = targetVersion ? `Target version: ${targetVersion}.` : '';
      const goalsText = goals?.length 
        ? `Focus on: ${goals.join(', ')}.` 
        : 'Focus on readability, performance, and maintainability.';

      const message = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert code refactorer for ${language}.
${versionHint}
${goalsText}
Return ONLY the refactored code with inline comments explaining major changes. No markdown.`,
          },
          {
            role: 'user',
            content: `Refactor this ${language} code:\n\n${sanitizeInput(code)}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      });

      const refactoredCode = message.choices[0].message.content;

      await db.query(
        `INSERT INTO ai_requests 
         (user_id, request_id, request_type, language, status, result, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, requestId, 'refactor_code', language, 'success', refactoredCode]
      );

      logger.info('Code refactoring successful', { userId, requestId });

      res.json({
        success: true,
        requestId,
        refactoredCode,
        language,
        targetVersion: targetVersion || 'latest',
        goals: goals || ['readability', 'performance'],
        tokens: {
          input: message.usage.prompt_tokens,
          output: message.usage.completion_tokens,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Code refactoring failed', {
        userId,
        requestId,
        error: err.message,
      });

      await db.query(
        `INSERT INTO ai_requests 
         (user_id, request_id, request_type, language, status, error, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, requestId, 'refactor_code', language, 'failed', err.message]
      );

      throw err;
    }
  })
);

/**
 * POST /api/ai/validate-code
 * Validate code syntax and best practices
 */
router.post(
  '/validate-code',
  validate('validateCode'),
  asyncHandler(async (req, res) => {
    const { code, language, rules } = req.validatedBody;
    const userId = req.user.id;
    const requestId = uuidv4();

    try {
      logger.info('Code validation requested', {
        userId,
        requestId,
        language,
        rules,
      });

      const rulesText = rules?.length 
        ? `Validate against: ${rules.join(', ')}.` 
        : 'Validate syntax, structure, and best practices.';

      const message = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert code validator for ${language}.
${rulesText}
Return validation result in JSON format with fields: isValid (boolean), errors (array of objects with line, message), warnings (array), score (0-100).`,
          },
          {
            role: 'user',
            content: `Validate this ${language} code:\n\n${sanitizeInput(code)}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      });

      let validation;
      const responseText = message.choices[0].message.content;
      
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        validation = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: responseText };
      } catch {
        validation = { raw: responseText };
      }

      await db.query(
        `INSERT INTO ai_requests 
         (user_id, request_id, request_type, language, status, result, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, requestId, 'validate_code', language, 'success', JSON.stringify(validation)]
      );

      logger.info('Code validation successful', { userId, requestId });

      res.json({
        success: true,
        requestId,
        validation,
        language,
        rules: rules || ['syntax', 'best-practices'],
        tokens: {
          input: message.usage.prompt_tokens,
          output: message.usage.completion_tokens,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Code validation failed', {
        userId,
        requestId,
        error: err.message,
      });

      await db.query(
        `INSERT INTO ai_requests 
         (user_id, request_id, request_type, language, status, error, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, requestId, 'validate_code', language, 'failed', err.message]
      );

      throw err;
    }
  })
);

module.exports = router;
