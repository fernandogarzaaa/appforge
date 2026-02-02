// deno-lint-ignore-file
/**
 * PayMongo Payment Integration Utility
 * Minimal helper for creating checkout links and retrieving payment metadata.
 *
 * Notes:
 * - Amounts are expected in major units (e.g., 20 = $20); we convert to cents.
 * - PayMongo currently supports PHP; configure currency accordingly.
 */

const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1';

interface PaymongoConfig {
  secretKey: string;
  publicKey: string;
  apiVersion: string;
}

export const initPaymongoClient = (): PaymongoConfig => {
  const secretKey = Deno.env.get('PAYMONGO_SECRET_KEY');
  const publicKey = Deno.env.get('PAYMONGO_PUBLIC_KEY') || '';
  const apiVersion = Deno.env.get('PAYMONGO_API_VERSION') || '2023-08-01';

  if (!secretKey) {
    throw new Error('PayMongo API keys not configured. Set PAYMONGO_SECRET_KEY.');
  }

  return { secretKey, publicKey, apiVersion };
};

const paymongoRequest = async (
  method: string,
  endpoint: string,
  body?: Record<string, unknown>,
  secretKey?: string
) => {
  const config = initPaymongoClient();
  const key = secretKey || config.secretKey;

  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Basic ${btoa(key)}`,
      'Content-Type': 'application/json',
      'Paymongo-Version': config.apiVersion,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${PAYMONGO_API_BASE}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`PayMongo API Error: ${response.status} - ${error.message}`);
  }

  return response.json();
};

export const createPaymentLink = async (
  customerId: string,
  amount: number,
  description: string,
  email: string,
  successUrl: string,
  secretKey?: string,
  currency: string = 'PHP'
) => {
  // PayMongo expects minor units (centavos). Round to avoid floating errors.
  const minorAmount = Math.round(amount * 100);

  const payload = {
    data: {
      attributes: {
        amount: minorAmount,
        currency,
        description,
        remarks: description,
        metadata: {
          customerId,
          email,
        },
        redirect: {
          success: successUrl,
          failed: `${successUrl.replace('success', 'failed')}`,
        },
      },
    },
  };

  const result = await paymongoRequest('POST', '/links', payload, secretKey);
  const link = result.data;

  return {
    id: link.id,
    invoice_url: link.attributes?.checkout_url,
    external_id: link.attributes?.reference_number,
    amount: link.attributes?.amount,
    currency: link.attributes?.currency,
  };
};

// PayMongo does not expose customer-specific invoice listing without additional metadata.
// We return an empty array to keep callers defensive until a richer billing flow is wired.
export const getCustomerInvoices = async (
  _customerId: string,
  _limit: number = 12,
  _secretKey?: string
) => {
  return [] as any[];
};

export default {
  initPaymongoClient,
  createPaymentLink,
  getCustomerInvoices,
};
