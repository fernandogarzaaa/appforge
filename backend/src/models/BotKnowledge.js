/**
 * Bot Knowledge Model
 * Stores knowledge base entries for bots (for RAG)
 */

import mongoose from 'mongoose';

const BotKnowledgeSchema = new mongoose.Schema({
  botId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
    required: true,
    index: true,
  },

  // Content
  content: {
    text: { type: String, required: true },
    title: String,
    summary: String,
    type: {
      type: String,
      enum: ['document', 'faq', 'article', 'code', 'api_doc', 'custom'],
      default: 'document',
    },
  },

  // Source Information
  source: {
    type: {
      type: String,
      enum: ['upload', 'url', 'manual', 'scrape', 'api', 'base44_entity'],
    },
    url: String,
    fileId: String,
    entityId: String,
    uploadedBy: mongoose.Schema.Types.ObjectId,
    uploadedAt: Date,
  },

  // Vector Embeddings (for semantic search)
  embedding: {
    vector: [Number], // 1536-dimensional vector from OpenAI
    model: { type: String, default: 'text-embedding-3-small' },
    dimension: { type: Number, default: 1536 },
  },

  // Metadata for search/filtering
  metadata: {
    category: String,
    tags: [String],
    language: { type: String, default: 'en' },
    priority: { type: Number, default: 5, min: 1, max: 10 },
    relevanceScore: Number,
  },

  // Usage Statistics
  usage: {
    retrievalCount: { type: Number, default: 0 },
    lastRetrievedAt: Date,
    helpfulCount: { type: Number, default: 0 },
    unhelpfulCount: { type: Number, default: 0 },
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isIndexed: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
});

// Indexes for vector search and filtering
BotKnowledgeSchema.index({ botId: 1, isActive: 1 });
BotKnowledgeSchema.index({ botId: 1, 'metadata.category': 1 });
BotKnowledgeSchema.index({ botId: 1, 'metadata.tags': 1 });
BotKnowledgeSchema.index({ 'source.entityId': 1 });

// Update timestamps
BotKnowledgeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('BotKnowledge', BotKnowledgeSchema);
