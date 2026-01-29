/**
 * Advanced Search Indexing System
 * Provides full-text search, fuzzy matching, caching, and relevance scoring
 */

/**
 * SearchIndex - Advanced search indexing with full-text search capabilities
 */
export class SearchIndex {
  constructor() {
    this.documents = new Map(); // documentId -> document
    this.invertedIndex = new Map(); // term -> Set(documentIds)
    this.cache = new Map(); // query -> results
    this.cacheSize = 100;
    this.stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  }

  /**
   * Add document to the index
   * @param {string} id - Document ID
   * @param {Object} document - Document data
   * @param {Array<string>} fields - Fields to index
   */
  addDocument(id, document, fields = ['name', 'description', 'tags']) {
    this.documents.set(id, document);
    
    // Extract and tokenize text from specified fields
    const tokens = this._extractTokens(document, fields);
    
    // Add to inverted index
    tokens.forEach(token => {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set());
      }
      this.invertedIndex.get(token).add(id);
    });

    // Clear cache when index changes
    this.cache.clear();
  }

  /**
   * Add multiple documents
   * @param {Array} documents - Array of {id, document, fields}
   */
  addDocuments(documents) {
    documents.forEach(({ id, document, fields }) => {
      this.addDocument(id, document, fields);
    });
  }

  /**
   * Remove document from index
   * @param {string} id - Document ID
   */
  removeDocument(id) {
    const document = this.documents.get(id);
    if (!document) return;

    // Remove from documents
    this.documents.delete(id);

    // Remove from inverted index
    this.invertedIndex.forEach((docIds, term) => {
      docIds.delete(id);
      if (docIds.size === 0) {
        this.invertedIndex.delete(term);
      }
    });

    // Clear cache
    this.cache.clear();
  }

  /**
   * Search documents with advanced features
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} Ranked search results
   */
  search(query, options = {}) {
    const {
      fuzzy = false,
      maxDistance = 2,
      limit = 10,
      offset = 0,
      boost = {},
      filters = {}
    } = options;

    // Check cache
    const cacheKey = JSON.stringify({ query, options });
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Tokenize query
    const queryTokens = this._tokenize(query);

    // Find matching documents
    const documentScores = new Map();

    queryTokens.forEach(token => {
      // Exact match
      if (this.invertedIndex.has(token)) {
        this.invertedIndex.get(token).forEach(docId => {
          const score = documentScores.get(docId) || 0;
          documentScores.set(docId, score + 1);
        });
      }

      // Fuzzy match if enabled
      if (fuzzy) {
        this.invertedIndex.forEach((docIds, indexedToken) => {
          const distance = this._levenshteinDistance(token, indexedToken);
          if (distance > 0 && distance <= maxDistance) {
            const fuzzyScore = 1 / (distance + 1);
            docIds.forEach(docId => {
              const score = documentScores.get(docId) || 0;
              documentScores.set(docId, score + fuzzyScore);
            });
          }
        });
      }
    });

    // Calculate relevance scores and apply filters
    let results = Array.from(documentScores.entries())
      .map(([docId, tokenScore]) => {
        const document = this.documents.get(docId);
        
        // Apply filters
        if (!this._matchesFilters(document, filters)) {
          return null;
        }

        // Calculate TF-IDF score
        const tfidf = this._calculateTFIDF(docId, queryTokens);
        
        // Apply field boosting
        const boostedScore = this._applyBoost(document, boost);
        
        // Combined score
        const relevance = (tokenScore * 0.4) + (tfidf * 0.4) + (boostedScore * 0.2);

        return {
          id: docId,
          document,
          score: relevance,
          highlights: this._generateHighlights(document, queryTokens)
        };
      })
      .filter(result => result !== null)
      .sort((a, b) => b.score - a.score);

    // Pagination
    const total = results.length;
    results = results.slice(offset, offset + limit);

    const searchResults = {
      results,
      total,
      hasMore: offset + limit < total,
      query,
      options
    };

    // Cache results
    this._cacheResults(cacheKey, searchResults);

    return searchResults;
  }

  /**
   * Get suggestions for autocomplete
   * @param {string} prefix - Prefix to match
   * @param {number} limit - Number of suggestions
   * @returns {Array} Suggestions
   */
  getSuggestions(prefix, limit = 5) {
    const prefixLower = prefix.toLowerCase();
    const suggestions = new Set();

    this.invertedIndex.forEach((_, term) => {
      if (term.startsWith(prefixLower)) {
        suggestions.add(term);
      }
    });

    return Array.from(suggestions)
      .slice(0, limit)
      .sort();
  }

  /**
   * Get search statistics
   * @returns {Object} Index statistics
   */
  getStats() {
    return {
      totalDocuments: this.documents.size,
      totalTerms: this.invertedIndex.size,
      cacheSize: this.cache.size,
      avgTermsPerDocument: this._calculateAvgTermsPerDoc()
    };
  }

  /**
   * Clear the index
   */
  clear() {
    this.documents.clear();
    this.invertedIndex.clear();
    this.cache.clear();
  }

  // Private methods
  _extractTokens(document, fields) {
    const text = fields
      .map(field => {
        const value = document[field];
        if (Array.isArray(value)) return value.join(' ');
        return value || '';
      })
      .join(' ');
    
    return this._tokenize(text);
  }

  _tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2 && !this.stopWords.has(token));
  }

  _levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  _calculateTFIDF(docId, queryTokens) {
    const document = this.documents.get(docId);
    const docTokens = this._extractTokens(document, ['name', 'description', 'tags']);
    
    let score = 0;
    queryTokens.forEach(token => {
      // Term Frequency
      const tf = docTokens.filter(t => t === token).length / docTokens.length;
      
      // Inverse Document Frequency
      const docsWithTerm = this.invertedIndex.get(token)?.size || 0;
      const idf = Math.log((this.documents.size + 1) / (docsWithTerm + 1));
      
      score += tf * idf;
    });

    return score;
  }

  _applyBoost(document, boost) {
    let score = 1;
    Object.entries(boost).forEach(([field, multiplier]) => {
      if (document[field]) {
        score *= multiplier;
      }
    });
    return score;
  }

  _matchesFilters(document, filters) {
    return Object.entries(filters).every(([field, value]) => {
      if (Array.isArray(value)) {
        return value.includes(document[field]);
      }
      return document[field] === value;
    });
  }

  _generateHighlights(document, queryTokens) {
    const highlights = [];
    const fields = ['name', 'description'];

    fields.forEach(field => {
      const text = document[field];
      if (!text) return;

      const words = text.split(/\s+/);
      const highlightedWords = words.map(word => {
        const normalized = word.toLowerCase().replace(/[^\w]/g, '');
        if (queryTokens.some(token => normalized.includes(token))) {
          return `<mark>${word}</mark>`;
        }
        return word;
      });

      const highlightedText = highlightedWords.join(' ');
      if (highlightedText.includes('<mark>')) {
        highlights.push({
          field,
          text: highlightedText
        });
      }
    });

    return highlights;
  }

  _cacheResults(key, results) {
    // LRU cache implementation
    if (this.cache.size >= this.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, results);
  }

  _calculateAvgTermsPerDoc() {
    if (this.documents.size === 0) return 0;
    
    let totalTerms = 0;
    this.invertedIndex.forEach(docIds => {
      totalTerms += docIds.size;
    });
    
    return (totalTerms / this.documents.size).toFixed(2);
  }
}

/**
 * Create and manage a global search index
 */
class SearchIndexManager {
  constructor() {
    this.indexes = new Map();
  }

  getIndex(name = 'default') {
    if (!this.indexes.has(name)) {
      this.indexes.set(name, new SearchIndex());
    }
    return this.indexes.get(name);
  }

  createIndex(name) {
    const index = new SearchIndex();
    this.indexes.set(name, index);
    return index;
  }

  deleteIndex(name) {
    this.indexes.delete(name);
  }

  clearAll() {
    this.indexes.forEach(index => index.clear());
  }
}

export const searchIndexManager = new SearchIndexManager();

export default SearchIndex;
