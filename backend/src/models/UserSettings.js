/**
 * User Settings Model
 * Stores user preferences, theme, LLM settings, and keyboard shortcuts
 */

import mongoose from 'mongoose';

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // LLM Settings
  llmSettings: {
    selectedModel: {
      type: String,
      default: 'gpt-4'
    },
    apiKey: {
      type: String,
      default: ''
    },
    settings: {
      temperature: {
        type: Number,
        default: 0.7,
        min: 0,
        max: 2
      },
      maxTokens: {
        type: Number,
        default: 2000
      },
      topP: {
        type: Number,
        default: 1,
        min: 0,
        max: 1
      },
      frequencyPenalty: {
        type: Number,
        default: 0,
        min: -2,
        max: 2
      },
      presencePenalty: {
        type: Number,
        default: 0,
        min: -2,
        max: 2
      }
    }
  },

  // LLM Usage Statistics
  llmUsage: {
    totalTokens: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    },
    queryCount: {
      type: Number,
      default: 0
    },
    modelBreakdown: {
      type: Map,
      of: Number,
      default: new Map()
    },
    history: {
      type: Array,
      default: []
    }
  },

  // Theme Settings
  theme: {
    currentTheme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    customTheme: {
      colors: {
        type: Map,
        of: String,
        default: new Map([
          ['primary', '#3b82f6'],
          ['secondary', '#1f2937'],
          ['accent', '#f59e0b']
        ])
      }
    },
    timeBasedTheme: {
      type: Boolean,
      default: false
    }
  },

  // Keyboard Shortcuts
  keyboardShortcuts: {
    shortcuts: {
      type: Map,
      of: String,
      default: new Map()
    },
    preset: {
      type: String,
      enum: ['default', 'vim', 'emacs', 'custom'],
      default: 'default'
    }
  },

  // Advanced Settings
  advancedSettings: {
    autoSave: {
      type: Boolean,
      default: true
    },
    notifications: {
      type: Boolean,
      default: true
    },
    analytics: {
      type: Boolean,
      default: true
    },
    privacy: {
      type: String,
      enum: ['public', 'private', 'friends-only'],
      default: 'private'
    },
    dataRetention: {
      type: Number,
      default: 90 // days
    }
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Update the updatedAt field before saving
userSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('UserSettings', userSettingsSchema);
