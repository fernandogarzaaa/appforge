/**
 * GraphQL API (minimal)
 */

const { buildSchema  } = require('graphql');
const { getMetricsSnapshot  } = require('../observability/metrics');
const { enqueueJob  } = require('../services/batchQueue');

const schema = buildSchema(`
  type Metrics {
    timestamp: String
    uptime: Float
    totalRequests: Int
  }

  type BatchJob {
    id: ID!
    type: String
    status: String
    progress: Int
    createdAt: String
  }

  type Query {
    health: String
    metrics: Metrics
  }

  type Mutation {
    enqueueBatchJob(type: String!, payload: String): BatchJob
  }
`);

const root = {
  health: () => 'OK',
  metrics: () => {
    const snapshot = getMetricsSnapshot();
    return {
      timestamp: snapshot.timestamp,
      uptime: snapshot.uptime,
      totalRequests: snapshot.requests.total
    };
  },
  enqueueBatchJob: async ({ type, payload }, context) => {
    const job = await enqueueJob(type, payload ? JSON.parse(payload) : {}, context.userId, context.tenantId);
    return job;
  }
};
