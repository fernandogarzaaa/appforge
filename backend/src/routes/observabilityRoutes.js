/**
 * Observability Routes
 */

const express = require('express');
const { getMetricsSnapshot, resetMetrics  } = require('../observability/metrics');
const { getRecentSpans, clearSpans  } = require('../observability/tracing');

const router = express.Router();

// Metrics snapshot
router.get('/metrics', (req, res) => {
  res.json(getMetricsSnapshot());
});

// Reset metrics (admin use)
router.post('/metrics/reset', (req, res) => {
  resetMetrics();
  res.json({ status: 'reset', timestamp: new Date().toISOString() });
});

// Recent traces
router.get('/traces', (req, res) => {
  const limit = parseInt(req.query.limit || '200', 10);
  res.json({ traces: getRecentSpans(limit) });
});

// Clear traces
router.post('/traces/clear', (req, res) => {
  clearSpans();
  res.json({ status: 'cleared', timestamp: new Date().toISOString() });
});

// Real-time metrics stream (SSE)
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = () => {
    res.write(`data: ${JSON.stringify(getMetricsSnapshot())}\n\n`);
  };

  send();
  const interval = setInterval(send, 2000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// Lightweight performance profile
router.get('/profile', (req, res) => {
  const snapshot = getMetricsSnapshot();
  res.json({
    timestamp: snapshot.timestamp,
    latency: snapshot.latency,
    eventLoopDelayMs: snapshot.process.eventLoopDelayMs,
    memory: snapshot.process.memoryUsage,
    cpu: snapshot.process.cpuUsage,
    loadAvg: snapshot.system.loadAvg
  });
});

module.exports = router;
