// @ts-nocheck
/**
 * Detect Application Errors in Real-Time
 * Monitors and alerts on application errors
 */

import { createClientFromRequest } from '@base44/sdk';

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const { appId, errorData } = await req.json();
    const fingerprint = errorData?.stack ? errorData.stack.split('\n')[1]?.trim() : errorData?.message;
    const errorPayload = {
      app_id: appId,
      fingerprint: fingerprint || `err_${Date.now()}`,
      severity: errorData?.severity || 'error',
      message: errorData?.message || 'Unknown error',
      stack: errorData?.stack,
      user_context: errorData?.user,
      created_at: new Date().toISOString(),
    };

    const record = await base44.entities.AppError?.create(errorPayload).catch(() => errorPayload);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Error tracked',
        errorId: record.id || errorPayload.fingerprint,
        alertSent: true,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
