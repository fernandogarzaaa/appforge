/**
 * Read Replica Routing (MongoDB)
 * Creates secondary connections for read-heavy workloads
 */

const mongoose = require('mongoose');

const readReplicas = [];
let replicaIndex = 0;

function configureReadReplicas(replicaUris = []) {
  for (const uri of replicaUris) {
    const conn = mongoose.createConnection(uri, {
      maxPoolSize: parseInt(process.env.MONGODB_REPLICA_MAX_POOL) || 50,
      minPoolSize: parseInt(process.env.MONGODB_REPLICA_MIN_POOL) || 5,
      readPreference: 'secondaryPreferred'
    });

    readReplicas.push(conn);
  }
}

function getReadConnection() {
  if (readReplicas.length === 0) {
    return mongoose.connection;
  }

  const conn = readReplicas[replicaIndex % readReplicas.length];
  replicaIndex += 1;
  return conn;
}

module.exports = {
  configureReadReplicas,
  getReadConnection
};
