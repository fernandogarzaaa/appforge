/**
 * Tracing Setup for AppForge Backend
 * Integrates OpenTelemetry with OTLP exporter
 * Instruments Express.js, PostgreSQL, Redis, and OpenAI API calls
 */

const { resourceFromAttributes } = require("@opentelemetry/resources");
const {
  NodeTracerProvider,
  SimpleSpanProcessor,
} = require("@opentelemetry/sdk-trace-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-proto");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const { ExpressInstrumentation } = require("@opentelemetry/instrumentation-express");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const { PgInstrumentation } = require("@opentelemetry/instrumentation-pg");
const { RedisInstrumentation } = require("@opentelemetry/instrumentation-redis");
const { OpenAIInstrumentation } = require("@traceloop/instrumentation-openai");

/**
 * Initialize OpenTelemetry tracing provider
 * @returns {NodeTracerProvider} Configured tracer provider
 */
function initializeTracing() {
  const exporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1/traces",
  });

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      "service.name": process.env.SERVICE_NAME || "appforge-backend",
      "service.version": process.env.SERVICE_VERSION || "1.0.0",
      "deployment.environment": process.env.NODE_ENV || "development",
    }),
  });

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

  // Register provider
  provider.register();

  // Register instrumentations
  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
      new RedisInstrumentation(),
      new OpenAIInstrumentation(),
    ],
  });

  console.log(
    `✓ Tracing initialized: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1/traces"}`
  );

  return provider;
}

module.exports = { initializeTracing };
