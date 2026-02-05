import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate boilerplate code (CRUD operations, UI components, API endpoints) for entities
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity_id, entity_name, entity_schema, code_type } = await req.json();

    if (!entity_name || !code_type) {
      return Response.json({ error: 'Missing entity_name or code_type' }, { status: 400 });
    }

    // Use AI to generate code
    const prompt = generatePrompt(entity_name, entity_schema, code_type);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          explanation: { type: 'string' },
          imports: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      success: true,
      code: result.code,
      explanation: result.explanation,
      imports: result.imports,
      entity_name,
      code_type
    });
  } catch (error) {
    console.error('Code generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generatePrompt(entityName, entitySchema, codeType) {
  const basePrompt = `Generate high-quality, production-ready boilerplate code for the entity "${entityName}".

Entity Schema:
${JSON.stringify(entitySchema, null, 2)}

Code Type: ${codeType}

Requirements:
- Use React hooks (useState, useEffect, useQuery, useMutation)
- Include proper error handling
- Add loading states
- Use TypeScript where appropriate
- Include JSDoc comments
- Follow React best practices
- Use Tailwind CSS for styling
- Include form validation
- Be concise but complete

${getCodeTypeSpecificInstructions(codeType)}

Return the code with clear explanations and list all required imports.`;

  return basePrompt;
}

function getCodeTypeSpecificInstructions(codeType) {
  const instructions = {
    'crud_component': `Generate a React component that:
- Lists all ${codeType} items
- Has create, read, update, delete functionality
- Includes pagination
- Has search/filter capabilities
- Uses base44.entities API`,
    
    'form_component': `Generate a React form component that:
- Handles all entity fields
- Includes validation
- Shows error messages
- Has success/loading states
- Submits via base44.entities.create()`,
    
    'api_endpoints': `Generate API endpoint handlers that:
- List items (GET)
- Create item (POST)
- Update item (PUT)
- Delete item (DELETE)
- Include authentication checks
- Validate input`,
    
    'service_class': `Generate a service class that:
- Wraps entity CRUD operations
- Includes error handling
- Has caching mechanisms
- Provides type safety
- Follows singleton pattern`
  };

  return instructions[codeType] || '';
}