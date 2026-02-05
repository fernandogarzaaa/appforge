import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Universal AI router - automatically uses QuantumAI if enabled
 * Falls back to base LLM if disabled by user or config
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    const { prompt, response_json_schema, add_context_from_internet, file_urls, temperature } = await req.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Check global config
    const configs = await base44.asServiceRole.entities.QuantumLLMConfig.list();
    const globalConfig = configs[0];
    const quantumEnabled = globalConfig?.enabled ?? true;

    // Check user preference (overrides global if user is authenticated)
    let useQuantum = quantumEnabled;
    if (user) {
      const prefs = await base44.entities.UserPreference.filter({ user_id: user.email });
      if (prefs.length > 0) {
        useQuantum = prefs[0].use_quantum_ai ?? quantumEnabled;
      }
    }

    // Route to appropriate LLM
    if (useQuantum) {
      const result = await base44.functions.invoke('quantumLLM', {
        prompt,
        response_json_schema,
        add_context_from_internet,
        file_urls,
        temperature
      });
      return Response.json(result.data);
    } else {
      // Direct call to base LLM
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema,
        add_context_from_internet: add_context_from_internet || false,
        file_urls
      });
      return Response.json({
        success: true,
        result,
        quantum_enhanced: false,
        model: 'BaseLLM',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('AI invocation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});