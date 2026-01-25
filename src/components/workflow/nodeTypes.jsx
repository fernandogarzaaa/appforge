import { GitBranch, Repeat, Zap, Code, Database, Plus, Filter, Clock, Send } from 'lucide-react';

export const ADVANCED_NODE_TYPES = {
  // Control Flow
  CONDITION: {
    id: 'condition',
    name: 'Conditional (If/Else)',
    category: 'control',
    icon: GitBranch,
    description: 'Branch execution based on conditions',
    config: {
      conditions: [
        {
          id: 'cond1',
          field: '',
          operator: 'equals',
          value: '',
          thenNodeId: null
        }
      ],
      elseNodeId: null
    }
  },
  LOOP: {
    id: 'loop',
    name: 'Loop',
    category: 'control',
    icon: Repeat,
    description: 'Repeat execution over items',
    config: {
      arrayField: '',
      itemVariableName: 'item',
      loopNodeId: null,
      maxIterations: 1000
    }
  },
  PARALLEL: {
    id: 'parallel',
    name: 'Parallel Execution',
    category: 'control',
    icon: Zap,
    description: 'Execute multiple paths simultaneously',
    config: {
      paths: [
        { id: 'path1', nodeId: null },
        { id: 'path2', nodeId: null }
      ]
    }
  },

  // Integration & API
  API_CALL: {
    id: 'api_call',
    name: 'API Request',
    category: 'integration',
    icon: Send,
    description: 'Make HTTP requests to external APIs',
    config: {
      method: 'GET',
      url: '',
      headers: {},
      body: null,
      queryParams: {},
      responseVariableName: 'apiResponse'
    }
  },
  DATABASE_QUERY: {
    id: 'database_query',
    name: 'Database Query',
    category: 'integration',
    icon: Database,
    description: 'Query and manipulate data',
    config: {
      entityName: '',
      operation: 'list', // list, filter, create, update, delete
      filter: {},
      data: {},
      variableName: 'dbResult'
    }
  },

  // Data Manipulation
  DATA_TRANSFORM: {
    id: 'data_transform',
    name: 'Data Transformation',
    category: 'data',
    icon: Code,
    description: 'Transform and format data',
    config: {
      sourceVariable: '',
      transformations: [
        {
          id: 'trans1',
          type: 'format_date', // format_date, calculate, concatenate, extract
          params: {}
        }
      ],
      outputVariable: 'transformed'
    }
  },
  FILTER: {
    id: 'filter',
    name: 'Filter',
    category: 'data',
    icon: Filter,
    description: 'Filter array based on conditions',
    config: {
      arrayVariable: '',
      conditions: [],
      outputVariable: 'filtered'
    }
  },

  // Standard
  ACTION: {
    id: 'action',
    name: 'Action',
    category: 'standard',
    icon: Plus,
    description: 'Execute an action or step',
    config: {
      description: ''
    }
  },
  DELAY: {
    id: 'delay',
    name: 'Delay',
    category: 'standard',
    icon: Clock,
    description: 'Wait for specified duration',
    config: {
      duration: 1,
      unit: 'seconds' // seconds, minutes, hours
    }
  }
};

export const NODE_OPERATORS = {
  equals: '==',
  notEquals: '!=',
  greaterThan: '>',
  lessThan: '<',
  greaterOrEqual: '>=',
  lessOrEqual: '<=',
  contains: 'contains',
  notContains: 'not contains',
  startsWith: 'starts with',
  endsWith: 'ends with'
};

export const TRANSFORMATION_TYPES = {
  format_date: {
    name: 'Format Date',
    params: ['input', 'format']
  },
  calculate: {
    name: 'Calculate',
    params: ['expression'] // Math expression like "a + b * 2"
  },
  concatenate: {
    name: 'Concatenate',
    params: ['parts', 'separator']
  },
  extract: {
    name: 'Extract',
    params: ['source', 'pattern'] // Regex pattern
  },
  uppercase: {
    name: 'Uppercase',
    params: ['text']
  },
  lowercase: {
    name: 'Lowercase',
    params: ['text']
  },
  trim: {
    name: 'Trim',
    params: ['text']
  },
  round: {
    name: 'Round Number',
    params: ['number', 'decimalPlaces']
  }
};