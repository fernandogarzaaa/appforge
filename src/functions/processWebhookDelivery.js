import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
const DEFAULT_TIMEOUT_MS = 30000;
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await req.json().catch(() => ({}));
        const { webhook_id, event_type, payload = {}, delivery_id, } = body || {};
        if (!webhook_id || !event_type) {
            return Response.json({ error: 'Missing webhook_id or event_type' }, { status: 400 });
        }
        const webhook = await base44.asServiceRole.entities.Webhook.get(webhook_id).catch(() => null);
        if (!webhook) {
            return Response.json({ error: 'Webhook not found' }, { status: 404 });
        }
        if (webhook.user_id && webhook.user_id !== user.email && webhook.scope !== 'team') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (webhook.is_active === false || webhook.active === false) {
            return Response.json({ error: 'Webhook is inactive' }, { status: 400 });
        }
        const deliveryId = delivery_id || `delivery_${crypto.randomUUID()}`;
        const requestPayload = {
            event: event_type,
            payload,
            timestamp: new Date().toISOString(),
            deliveryId,
        };
        let deliveryRecord = null;
        if (delivery_id) {
            deliveryRecord = await base44.asServiceRole.entities.WebhookDelivery.get(delivery_id).catch(() => null);
        }
        if (!deliveryRecord) {
            deliveryRecord = await base44.asServiceRole.entities.WebhookDelivery.create({
                id: deliveryId,
                webhook_id,
                event_type,
                payload,
                status: 'pending',
                attempts: 0,
                response_time_ms: 0,
                status_code: null,
                error: null,
                created_at: new Date().toISOString(),
                last_attempt_at: new Date().toISOString(),
            });
        }
        const signature = webhook.secret
            ? await createSignature(webhook.secret, JSON.stringify(payload))
            : '';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
        const startTime = performance.now();
        let status = 'failed';
        let statusCode = null;
        let errorMessage = null;
        let responseTime = 0;
        try {
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': event_type,
                    'X-Webhook-Id': webhook_id,
                    'X-Webhook-Delivery': deliveryId,
                    ...(webhook.headers || {}),
                },
                body: JSON.stringify(requestPayload),
                signal: controller.signal,
            });
            responseTime = performance.now() - startTime;
            statusCode = response.status;
            if (response.ok) {
                status = 'success';
            }
            else {
                errorMessage = `HTTP ${response.status}`;
            }
        }
        catch (error) {
            responseTime = performance.now() - startTime;
            errorMessage = error.message || 'Webhook delivery failed';
        }
        finally {
            clearTimeout(timeoutId);
        }
        const updated = await base44.asServiceRole.entities.WebhookDelivery.update(deliveryRecord.id, {
            status,
            status_code: statusCode,
            response_time_ms: Math.round(responseTime),
            attempts: (deliveryRecord.attempts || 0) + 1,
            last_attempt_at: new Date().toISOString(),
            error: errorMessage,
        });
        return Response.json({
            success: status === 'success',
            delivery: updated,
            status,
            status_code: statusCode,
            response_time_ms: Math.round(responseTime),
            error: errorMessage,
        });
    }
    catch (error) {
        console.error('Webhook delivery error:', error);
        return Response.json({ error: error.message || 'Webhook delivery failed' }, { status: 500 });
    }
});
async function createSignature(secret, payload) {
    if (!secret)
        return '';
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureHex = signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `sha256=${signatureHex}`;
}
