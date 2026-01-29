/**
 * Initialize search indexes with data from the backend
 */
import { searchIndexManager } from './searchIndexing';
import { base44 } from '@/api/base44Client';

let initialized = false;

/**
 * Initialize search indexes with backend data
 */
export async function initializeSearchIndexes() {
  if (initialized) return;

  try {
    // Get functions index
    const functionsIndex = searchIndexManager.getIndex('functions');

    // Fetch all functions from backend
    const response = await base44.functions.execute('advancedSearch', {
      action: 'getFacets'
    });

    if (response.data?.functions) {
      // Index all functions
      const documents = response.data.functions.map(fn => ({
        id: fn.id || fn.name,
        document: {
          name: fn.name,
          description: fn.description || '',
          tags: fn.tags || [],
          type: 'function',
          category: fn.category || 'general'
        },
        fields: ['name', 'description', 'tags']
      }));

      functionsIndex.addDocuments(documents);
      console.log(`Indexed ${documents.length} functions for search`);
    }

    // You can add more indexes here for other data types
    // e.g., projects, entities, pages, etc.

    initialized = true;
  } catch (error) {
    console.error('Failed to initialize search indexes:', error);
  }
}

/**
 * Update search index with new item
 */
export function updateSearchIndex(type, id, data) {
  const indexName = type === 'function' ? 'functions' : type;
  const index = searchIndexManager.getIndex(indexName);

  index.addDocument(id, data, ['name', 'description', 'tags']);
}

/**
 * Remove item from search index
 */
export function removeFromSearchIndex(type, id) {
  const indexName = type === 'function' ? 'functions' : type;
  const index = searchIndexManager.getIndex(indexName);

  index.removeDocument(id);
}

/**
 * Clear all search indexes
 */
export function clearSearchIndexes() {
  searchIndexManager.clearAll();
  initialized = false;
}

/**
 * Get search index statistics
 */
export function getSearchIndexStats() {
  const stats = {};
  
  ['functions', 'projects', 'entities'].forEach(indexName => {
    const index = searchIndexManager.getIndex(indexName);
    stats[indexName] = index.getStats();
  });

  return stats;
}

export default initializeSearchIndexes;
