// This shim keeps legacy imports working while we migrate to PayMongo.
// All exports are forwarded to the PayMongo client implementation.
export * from './paymongoClient.ts';
export { createPaymentLink, getCustomerInvoices, initPaymongoClient as initXenditClient } from './paymongoClient.ts';

