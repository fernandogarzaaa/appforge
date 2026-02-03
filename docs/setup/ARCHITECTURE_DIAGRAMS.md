# AppForge Queue Infrastructure - Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Application                        │
│                     (React on :5173)                            │
└─────────────────────────────┬─────────────────────────────────┘
                              │ HTTP/WebSocket
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Express Backend API                         │
│                  (http://localhost:5000)                        │
│                                                                 │
│  ├─ Job Management Routes (/api/queue/*)                      │
│  ├─ Scheduled Job Routes (/api/scheduled/*)                   │
│  ├─ Webhook Routes (/api/webhooks/*)                          │
│  ├─ Observability Routes (/api/observability/*)               │
│  └─ Bull Board Dashboard (/admin/bull)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         ↓                                 ↓
┌──────────────────────────┐    ┌──────────────────────────┐
│    BullMQ Queue          │    │   Webhook Service        │
│                          │    │                          │
│ • Job Enqueue            │    │ • Event Persistence      │
│ • Job Dequeue            │    │ • HMAC Signing           │
│ • Job Retry Logic        │    │ • Retry Mechanism        │
│ • Dead Letter Queue       │    │ • Audit Logging          │
│ • Priority Management    │    │ • MongoDB Storage        │
└──────────────┬───────────┘    └──────────┬───────────────┘
               │                           │
         ┌─────┴─────┐            ┌────────┴────────┐
         ↓           ↓            ↓                 ↓
    ┌────────┐  ┌────────┐  ┌──────────────┐  ┌─────────┐
    │ Batch  │  │Schedule│  │External HTTP │  │MongoDB  │
    │Worker  │  │ Worker │  │Webhooks      │  │Database │
    └────┬───┘  └────┬───┘  └──────────────┘  └─────────┘
         │           │
         └─────┬─────┘
               ↓
    ┌──────────────────────────┐
    │  Job Storage             │
    ├──────────────────────────┤
    │ • Redis (Optional)       │
    │ • or In-Memory Cache     │
    │ • (Auto-fallback)        │
    └──────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────┐
│ Create Job   │
│ via API      │
└──────┬───────┘
       │
       ↓
  ┌────────────────────────────────┐
  │ POST /api/queue/jobs           │
  │ {                              │
  │   type: "quantum-analysis",    │
  │   data: { ... },               │
  │   options: { priority: 1 }     │
  │ }                              │
  └────────┬─────────────────────┘
           │
           ↓
   ┌───────────────────────┐
   │ BullMQ Queue          │
   │ (Redis/In-Memory)     │
   └───────┬───────────────┘
           │
      ┌────┴─────┐
      ↓          ↓
  ┌────────┐  ┌────────────┐
  │ Batch  │  │ Scheduled  │
  │ Worker │  │ Worker     │
  └────┬───┘  └────┬───────┘
       │           │
       ↓           ↓
  ┌─────────────────────────────┐
  │ Job Processors              │
  │ • quantum-analysis          │
  │ • security-scan             │
  │ • code-review               │
  │ • custom                    │
  └────────┬────────────────────┘
           │
       ┌───┴────────────────────┐
       ↓                        ↓
  ┌─────────────┐       ┌──────────────┐
  │ Success     │       │ Failed/Retry │
  │ Remove      │       │ Exponential  │
  │ from Queue  │       │ Backoff      │
  └─────────────┘       └───────┬──────┘
                                │
                        ┌───────┴─────┐
                        ↓             ↓
                    ┌────────┐   ┌─────────────┐
                    │ Retry  │   │Dead Letter  │
                    │ Queue  │   │Queue (DLQ)  │
                    └────────┘   └─────────────┘
```

## State Machine: Job Lifecycle

```
                ┌─────────────────────────────────────┐
                │  Job Created                        │
                │  (In Redis or Memory)               │
                └────────────────┬────────────────────┘
                                 │
                        ┌────────────────────┐
                        │ Check Delay        │
                        │ Check Priority     │
                        └────────┬───────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                        │
                    ↓                        ↓
            ┌──────────────┐        ┌───────────────┐
            │ Ready        │        │ Delayed       │
            │ (Normal Job) │        │ (Cron/Delay)  │
            └──────┬───────┘        └───────┬───────┘
                   │                        │
                   └────────────┬───────────┘
                                ↓
                        ┌───────────────────┐
                        │ Active            │
                        │ (Being Processed) │
                        └────────┬──────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                        │
                    ↓                        ↓
            ┌──────────────┐        ┌──────────────┐
            │ Completed    │        │ Failed       │
            │ ✅           │        │ ❌           │
            └──────────────┘        └──────┬───────┘
                                           │
                            ┌──────────────┴──────────┐
                            │ Attempt < Max?          │
                            └──────────────┬──────────┘
                                    Yes ↙  ↖ No
                            ┌─────────────────┐
                            │ Waiting (Retry) │
                            │ + Exponential   │
                            │   Backoff       │
                            └────────┬────────┘
                                     │
                            ┌────────┴─────────┐
                            │ Retry Delay      │
                            │ Elapsed?         │
                            └────────┬─────────┘
                                     ↓
                        ┌──────────────────────┐
                        │ Ready (for retry)    │
                        └──────────────────────┘
                                     │
                            ┌────────┴──────────┐
                            ↓                   ↓
                    ┌────────────────┐  ┌──────────────────┐
                    │ Try Again      │  │ Max Retries Done │
                    │ (Loop)         │  │ → DLQ            │
                    └────────────────┘  └──────────────────┘
```

## Monitoring Architecture

```
┌──────────────────────────────────────────────────────────┐
│                 Monitoring & Observability               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐       ┌──────────────────────┐   │
│  │ Bull Board       │       │ React Dashboard      │   │
│  │ Web UI           │       │ Real-time Monitor    │   │
│  │ (Job Inspector)  │       │ (WebSocket)          │   │
│  └────────┬─────────┘       └──────────┬───────────┘   │
│           │                            │               │
│           └───────────┬────────────────┘               │
│                       ↓                                 │
│           ┌───────────────────────┐                    │
│           │ Prometheus Metrics    │                    │
│           │ (/metrics endpoint)   │                    │
│           └───────────┬───────────┘                    │
│                       │                                 │
│           ┌───────────┴───────────┐                    │
│           ↓                       ↓                    │
│       ┌─────────────┐     ┌──────────────┐           │
│       │ Prometheus  │     │ Grafana      │           │
│       │ TimeSeries  │     │ Dashboards   │           │
│       │ Database    │     │ (Optional)   │           │
│       └─────────────┘     └──────────────┘           │
│                                                       │
│  Metrics Tracked:                                    │
│  • Queue depth                                       │
│  • Job completion rate                               │
│  • Processing time per job                           │
│  • Failure rate                                      │
│  • Webhook delivery status                           │
│  • Worker utilization                                │
│  • Retry attempts                                    │
│  • DLQ size                                          │
│                                                       │
└──────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
DEVELOPMENT
└─ Single Machine (localhost:5000)
   └─ One Process (npm run dev)
      └─ In-Memory Queue
      └─ Batch Worker
      └─ Scheduled Worker

────────────────────────────────────────

PRODUCTION
├─ Load Balancer
│  └─ Distributes traffic
│
├─ API Servers (Multiple)
│  ├─ Enqueue jobs only
│  └─ Don't process jobs
│
├─ Redis Cluster
│  └─ Persistent storage
│  └─ Job queue
│
├─ Worker Servers (Multiple)
│  ├─ Batch Worker (5 processes)
│  ├─ Scheduled Worker (3 processes)
│  └─ Custom Processors
│
├─ MongoDB
│  ├─ Job history
│  ├─ Webhook events
│  └─ Audit logs
│
└─ Monitoring
   ├─ Prometheus
   ├─ Grafana
   └─ Alert Manager
```

## Database Schema (Simplified)

```
Redis (Key-Value Store)
├─ bull:queue:jobs
│  └─ { jobId: { type, data, status, attempts, ... } }
├─ bull:queue:delayed
│  └─ { timestamp: [jobIds...] }
├─ bull:queue:active
│  └─ { workerId: jobId }
└─ bull:queue:completed
   └─ { jobId: completedData }

MongoDB Collections
├─ jobs
│  └─ { _id, jobId, type, data, status, createdAt, completedAt }
├─ webhooks
│  └─ { _id, event, payload, signature, status, attempts, nextRetry }
└─ audit_logs
   └─ { _id, action, jobId, timestamp, userId, details }
```

---

**For detailed API documentation, see README_QUEUE.md**
**For production deployment, see PRODUCTION_QUEUE_INFRASTRUCTURE.md**
**For quick start, see START_HERE.md**
