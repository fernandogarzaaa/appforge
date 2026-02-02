import { logger } from '../src/functions/utils/logger.ts';

Deno.serve(async (req) => {
  const eventType = req.headers.get('paymongo-event') || 'unknown';
  const rawBody = await req.text();
  logger.info('PayMongo webhook placeholder received', { eventType, bodyLength: rawBody.length });
  return Response.json({
    received: true,
    provider: 'paymongo',
    note: 'Implement signature verification and event handling when PayMongo Billing is connected.'
  });
});
