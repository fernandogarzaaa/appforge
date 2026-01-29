import { describe, it, expect, beforeEach } from 'vitest';
import { SearchIndex, searchIndexManager } from '../searchIndexing';

describe('SearchIndex', () => {
  let index;

  beforeEach(() => {
    index = new SearchIndex();
  });

  describe('addDocument', () => {
    it('should add a document to the index', () => {
      index.addDocument('doc1', {
        name: 'Test Document',
        description: 'This is a test document',
        tags: ['test', 'sample']
      });

      const stats = index.getStats();
      expect(stats.totalDocuments).toBe(1);
    });

    it('should tokenize and index document fields', () => {
      index.addDocument('doc1', {
        name: 'JavaScript Tutorial',
        description: 'Learn JavaScript programming'
      });

      const stats = index.getStats();
      expect(stats.totalTerms).toBeGreaterThan(0);
    });

    it('should clear cache when adding documents', () => {
      index.addDocument('doc1', { name: 'First' });
      index.search('first');
      
      const cacheSize1 = index.getStats().cacheSize;
      index.addDocument('doc2', { name: 'Second' });
      const cacheSize2 = index.getStats().cacheSize;

      expect(cacheSize2).toBe(0);
    });
  });

  describe('addDocuments', () => {
    it('should add multiple documents', () => {
      const docs = [
        { id: 'doc1', document: { name: 'First' } },
        { id: 'doc2', document: { name: 'Second' } },
        { id: 'doc3', document: { name: 'Third' } }
      ];

      index.addDocuments(docs);
      expect(index.getStats().totalDocuments).toBe(3);
    });
  });

  describe('removeDocument', () => {
    it('should remove a document from the index', () => {
      index.addDocument('doc1', { name: 'Test' });
      index.removeDocument('doc1');

      expect(index.getStats().totalDocuments).toBe(0);
    });

    it('should clean up inverted index', () => {
      index.addDocument('doc1', { name: 'unique term' });
      const statsBefore = index.getStats();
      
      index.removeDocument('doc1');
      const statsAfter = index.getStats();

      expect(statsAfter.totalTerms).toBeLessThan(statsBefore.totalTerms);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      index.addDocuments([
        { id: '1', document: { name: 'JavaScript Tutorial', description: 'Learn JavaScript' } },
        { id: '2', document: { name: 'Python Guide', description: 'Learn Python programming' } },
        { id: '3', document: { name: 'Java Programming', description: 'Advanced Java concepts' } }
      ]);
    });

    it('should find exact matches', () => {
      const results = index.search('JavaScript');
      expect(results.total).toBeGreaterThan(0);
      expect(results.results[0].id).toBe('1');
    });

    it('should rank results by relevance', () => {
      const results = index.search('programming');
      expect(results.results.length).toBeGreaterThan(0);
      expect(results.results[0].score).toBeGreaterThan(0);
    });

    it('should support fuzzy matching', () => {
      const results = index.search('Javascrpt', { fuzzy: true });
      expect(results.total).toBeGreaterThan(0);
    });

    it('should respect maxDistance for fuzzy search', () => {
      const results1 = index.search('Jva', { fuzzy: true, maxDistance: 1 });
      const results2 = index.search('Jva', { fuzzy: true, maxDistance: 2 });

      expect(results2.total).toBeGreaterThanOrEqual(results1.total);
    });

    it('should apply filters', () => {
      index.clear();
      index.addDocuments([
        { id: '1', document: { name: 'Doc 1', type: 'article' } },
        { id: '2', document: { name: 'Doc 2', type: 'tutorial' } }
      ]);

      const results = index.search('doc', { filters: { type: 'article' } });
      expect(results.total).toBe(1);
      expect(results.results[0].document.type).toBe('article');
    });

    it('should support array filters', () => {
      index.clear();
      index.addDocuments([
        { id: '1', document: { name: 'Doc 1', status: 'active' } },
        { id: '2', document: { name: 'Doc 2', status: 'draft' } },
        { id: '3', document: { name: 'Doc 3', status: 'archived' } }
      ]);

      const results = index.search('doc', { filters: { status: ['active', 'draft'] } });
      expect(results.total).toBe(2);
    });

    it('should apply field boosting', () => {
      index.clear();
      index.addDocuments([
        { id: '1', document: { name: 'Important', featured: true } },
        { id: '2', document: { name: 'Regular', featured: false } }
      ]);

      const results = index.search('important regular', { boost: { featured: 2 } });
      expect(results.results[0].id).toBe('1');
    });

    it('should support pagination', () => {
      index.clear();
      for (let i = 0; i < 20; i++) {
        index.addDocument(`doc${i}`, { name: `Document ${i}` });
      }

      const page1 = index.search('document', { limit: 5, offset: 0 });
      const page2 = index.search('document', { limit: 5, offset: 5 });

      expect(page1.results).toHaveLength(5);
      expect(page2.results).toHaveLength(5);
      expect(page1.results[0].id).not.toBe(page2.results[0].id);
      expect(page1.hasMore).toBe(true);
    });

    it('should generate highlights', () => {
      const results = index.search('JavaScript');
      expect(results.results[0].highlights.length).toBeGreaterThan(0);
      expect(results.results[0].highlights[0].text).toContain('<mark>');
    });

    it('should cache results', () => {
      index.search('JavaScript');
      const stats1 = index.getStats();

      index.search('JavaScript');
      const stats2 = index.getStats();

      expect(stats2.cacheSize).toBe(stats1.cacheSize);
    });
  });

  describe('getSuggestions', () => {
    beforeEach(() => {
      index.addDocuments([
        { id: '1', document: { name: 'JavaScript tutorial' } },
        { id: '2', document: { name: 'Java programming' } },
        { id: '3', document: { name: 'Python guide' } }
      ]);
    });

    it('should return matching suggestions', () => {
      const suggestions = index.getSuggestions('java');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.startsWith('java'))).toBe(true);
    });

    it('should limit suggestions', () => {
      const suggestions = index.getSuggestions('t', 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should return sorted suggestions', () => {
      const suggestions = index.getSuggestions('p');
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i] >= suggestions[i - 1]).toBe(true);
      }
    });
  });

  describe('getStats', () => {
    it('should return index statistics', () => {
      index.addDocument('doc1', { name: 'Test document' });

      const stats = index.getStats();
      expect(stats).toHaveProperty('totalDocuments');
      expect(stats).toHaveProperty('totalTerms');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('avgTermsPerDocument');
    });
  });

  describe('clear', () => {
    it('should clear all index data', () => {
      index.addDocument('doc1', { name: 'Test' });
      index.clear();

      const stats = index.getStats();
      expect(stats.totalDocuments).toBe(0);
      expect(stats.totalTerms).toBe(0);
    });
  });

  describe('tokenization', () => {
    it('should filter stop words', () => {
      index.addDocument('doc1', { name: 'the quick brown fox' });

      const results = index.search('the');
      // "the" is a stop word and should be filtered
      expect(results.total).toBe(0);
    });

    it('should handle minimum token length', () => {
      index.addDocument('doc1', { name: 'a b cd efg' });

      // Tokens shorter than 3 chars should be filtered
      const stats = index.getStats();
      expect(stats.totalTerms).toBeLessThan(4);
    });

    it('should normalize to lowercase', () => {
      index.addDocument('doc1', { name: 'JavaScript' });

      const results1 = index.search('javascript');
      const results2 = index.search('JAVASCRIPT');

      expect(results1.total).toBe(results2.total);
    });
  });

  describe('TF-IDF scoring', () => {
    it('should rank documents with higher term frequency higher', () => {
      index.addDocuments([
        { id: '1', document: { name: 'test test test' } },
        { id: '2', document: { name: 'test other words' } }
      ]);

      const results = index.search('test');
      expect(results.results[0].id).toBe('1');
    });
  });

  describe('Levenshtein distance', () => {
    it('should calculate edit distance correctly', () => {
      const dist1 = index._levenshteinDistance('cat', 'cat');
      const dist2 = index._levenshteinDistance('cat', 'cut');
      const dist3 = index._levenshteinDistance('cat', 'dog');

      expect(dist1).toBe(0);
      expect(dist2).toBe(1);
      expect(dist3).toBeGreaterThan(dist2);
    });
  });

  describe('cache management', () => {
    it('should implement LRU cache', () => {
      index.cacheSize = 3;

      for (let i = 0; i < 5; i++) {
        index.addDocument(`doc${i}`, { name: `doc ${i}` });
        index.clear(); // Reset to re-enable caching
        index.addDocument(`doc${i}`, { name: `doc ${i}` });
        index.search(`query${i}`);
      }

      const stats = index.getStats();
      expect(stats.cacheSize).toBeLessThanOrEqual(3);
    });
  });
});

describe('SearchIndexManager', () => {
  beforeEach(() => {
    searchIndexManager.clearAll();
  });

  describe('getIndex', () => {
    it('should create default index', () => {
      const index = searchIndexManager.getIndex();
      expect(index).toBeInstanceOf(SearchIndex);
    });

    it('should create named index', () => {
      const index = searchIndexManager.getIndex('custom');
      expect(index).toBeInstanceOf(SearchIndex);
    });

    it('should return existing index', () => {
      const index1 = searchIndexManager.getIndex('test');
      const index2 = searchIndexManager.getIndex('test');
      expect(index1).toBe(index2);
    });
  });

  describe('createIndex', () => {
    it('should create a new index', () => {
      const index = searchIndexManager.createIndex('new');
      expect(index).toBeInstanceOf(SearchIndex);
    });
  });

  describe('deleteIndex', () => {
    it('should delete an index', () => {
      searchIndexManager.createIndex('temp');
      searchIndexManager.deleteIndex('temp');

      const index = searchIndexManager.getIndex('temp');
      expect(index.getStats().totalDocuments).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('should clear all indexes', () => {
      const index1 = searchIndexManager.getIndex('index1');
      const index2 = searchIndexManager.getIndex('index2');

      index1.addDocument('doc1', { name: 'Test 1' });
      index2.addDocument('doc2', { name: 'Test 2' });

      searchIndexManager.clearAll();

      expect(index1.getStats().totalDocuments).toBe(0);
      expect(index2.getStats().totalDocuments).toBe(0);
    });
  });
});
