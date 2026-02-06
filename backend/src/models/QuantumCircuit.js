/**
 * Quantum Circuit Model
 * Stores quantum circuits with gates and qubits configuration
 */

import mongoose from 'mongoose';

const gateSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['H', 'X', 'Y', 'Z', 'CNOT', 'T', 'S', 'RX', 'RY', 'RZ', 'SWAP'],
  },
  target: {
    type: Number,
    required: true,
  },
  control: {
    type: Number,
    default: null,
  },
  angle: {
    type: Number,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const quantumCircuitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  qubits: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },
  gates: [gateSchema],
  status: {
    type: String,
    enum: ['draft', 'ready', 'simulated', 'executed', 'archived'],
    default: 'draft',
    index: true,
  },
  simulationResults: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  executionResults: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  metadata: {
    algorithm: String,
    complexity: Number,
    depth: Number,
    tags: [String],
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true,
  },
  clonedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuantumCircuit',
    default: null,
  },
  executionCount: {
    type: Number,
    default: 0,
  },
  lastExecuted: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for performance
quantumCircuitSchema.index({ userId: 1, createdAt: -1 });
quantumCircuitSchema.index({ userId: 1, status: 1 });
quantumCircuitSchema.index({ isPublic: 1, createdAt: -1 });
quantumCircuitSchema.index({ 'metadata.tags': 1 });

// Virtual for gate count
quantumCircuitSchema.virtual('gateCount').get(function() {
  return this.gates ? this.gates.length : 0;
});

// Instance methods
quantumCircuitSchema.methods.addGate = function(gate) {
  this.gates.push(gate);
  return this.save();
};

quantumCircuitSchema.methods.removeGate = function(index) {
  if (index >= 0 && index < this.gates.length) {
    this.gates.splice(index, 1);
    return this.save();
  }
  throw new Error('Invalid gate index');
};

quantumCircuitSchema.methods.clearGates = function() {
  this.gates = [];
  return this.save();
};

quantumCircuitSchema.methods.clone = async function(userId) {
  const cloned = new this.constructor({
    userId,
    name: `${this.name} (Clone)`,
    description: this.description,
    qubits: this.qubits,
    gates: this.gates,
    metadata: this.metadata,
    clonedFrom: this._id,
  });
  return cloned.save();
};

// Static methods
quantumCircuitSchema.statics.findByUserId = function(userId, options = {}) {
  const { status, limit = 50, skip = 0 } = options;
  const query = { userId };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('-simulationResults -executionResults'); // Exclude large fields
};

quantumCircuitSchema.statics.findPublic = function(options = {}) {
  const { limit = 50, skip = 0, tags } = options;
  const query = { isPublic: true };

  if (tags && tags.length > 0) {
    query['metadata.tags'] = { $in: tags };
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('-simulationResults -executionResults')
    .populate('userId', 'username email');
};

quantumCircuitSchema.statics.getStatsByUser = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const total = await this.countDocuments({ userId });
  const totalExecutions = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: '$executionCount' } } },
  ]);

  return {
    total,
    byStatus: stats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    totalExecutions: totalExecutions[0]?.total || 0,
  };
};

// Pre-save middleware
quantumCircuitSchema.pre('save', function(next) {
  // Calculate circuit depth
  if (this.gates && this.gates.length > 0) {
    this.metadata = this.metadata || {};
    this.metadata.depth = this.gates.length;
    this.metadata.complexity = this.gates.length * this.qubits;
  }
  next();
});

const QuantumCircuit = mongoose.model('QuantumCircuit', quantumCircuitSchema);

export default QuantumCircuit;
