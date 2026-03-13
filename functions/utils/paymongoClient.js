/**
 * PayMongo client utilities for payment processing
 */
export async function createPaymentLink(clientId, amount, description, email, redirectUrl, secretKey, currency = 'USD') {
    const payload = {
        data: {
            attributes: {
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toUpperCase(),
                description,
                statement_descriptor: 'AppForge Subscription',
                redirect: {
                    success: redirectUrl,
                    failed: redirectUrl + '&failed=true'
                },
                client_key: clientId,
                type: 'invoice'
            }
        }
    };
    const response = await fetch('https://api.paymongo.com/v1/links', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${btoa(secretKey + ':')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.detail || 'Failed to create payment link');
    }
    const data = await response.json();
    return {
        id: data.data.id,
        invoice_url: data.data.attributes.short_url || data.data.attributes.checkout_url,
        external_id: data.data.attributes.client_key,
        reference_number: data.data.attributes.reference_number
    };
}
export async function verifyWebhookSignature(payload, signature, secretKey) {
    const encodedKey = new TextEncoder().encode(secretKey);
    const encodedPayload = new TextEncoder().encode(payload);
    const key = await crypto.subtle.importKey('raw', encodedKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signed = await crypto.subtle.sign('HMAC', key, encodedPayload);
    const computedSignature = Array.from(new Uint8Array(signed))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    return computedSignature === signature;
}
export async function getPaymentDetails(paymentId, secretKey) {
    const response = await fetch(`https://api.paymongo.com/v1/payments/${paymentId}`, {
        headers: {
            'Authorization': `Basic ${btoa(secretKey + ':')}`
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch payment details');
    }
    return await response.json();
}
