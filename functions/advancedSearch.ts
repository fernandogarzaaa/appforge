// deno-lint-ignore-file
/**
 * Advanced Search & Discovery
 * Full-text search across projects, files, functions with AI-powered suggestions
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Search index (use Elasticsearch or similar in production)
const searchIndex = new Map();

interface SearchResult {
  id: string;
  type: 'project' | 'entity' | 'page' | 'component' | 'function' | 'file';
  title: string;
  description?: string;
  content?: string;
  score: number;
  highlights?: string[];
  metadata?: any;
  url?: string;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, query, filters, limit, offset, sortBy } = await req.json();

    switch (action) {
      case 'search': {
        if (!query || query.trim().length < 2) {
          return Response.json({ 
            error: 'Query must be at least 2 characters' 
          }, { status: 400 });
        }

        // Search across all resources
        const results = await performSearch(base44, query, filters, user.id);

        // Apply sorting
        let sortedResults = results;
        if (sortBy === 'date') {
          sortedResults.sort((a, b) => 
            (b.metadata?.updated_date || 0) - (a.metadata?.updated_date || 0)
          );
        } else if (sortBy === 'type') {
          sortedResults.sort((a, b) => a.type.localeCompare(b.type));
        } else {
          // Default: sort by relevance score
          sortedResults.sort((a, b) => b.score - a.score);
        }

        // Pagination
        const total = sortedResults.length;
        const start = offset || 0;
        const end = start + (limit || 20);
        const paginatedResults = sortedResults.slice(start, end);

        // Generate suggestions
        const suggestions = generateSearchSuggestions(query, results);

        return Response.json({
          results: paginatedResults,
          total,
          limit: limit || 20,
          offset: start,
          suggestions,
          facets: generateFacets(results)
        }, { status: 200 });
      }

      case 'suggest': {
        // Auto-complete suggestions
        if (!query || query.length < 1) {
          return Response.json({ suggestions: [] }, { status: 200 });
        }

        const suggestions = await generateAutocomplete(base44, query, user.id);

        return Response.json({ suggestions }, { status: 200 });
      }

      case 'searchCode': {
        // Code-specific search
        if (!query) {
          return Response.json({ error: 'Query required' }, { status: 400 });
        }

        const codeResults = await searchCode(base44, query, filters, user.id);

        return Response.json({ results: codeResults }, { status: 200 });
      }

      case 'searchFiles': {
        // File name search
        if (!query) {
          return Response.json({ error: 'Query required' }, { status: 400 });
        }

        const fileResults = await searchFiles(base44, query, filters, user.id);

        return Response.json({ results: fileResults }, { status: 200 });
      }

      case 'recentSearches': {
        // Get user's recent searches (stored in session/DB)
        const recent = []; // Would fetch from database

        return Response.json({ searches: recent }, { status: 200 });
      }

      case 'popularSearches': {
        // Get trending/popular searches
        const popular = [
          'authentication',
          'payment integration',
          'API endpoints',
          'database schema',
          'React components'
        ];

        return Response.json({ searches: popular }, { status: 200 });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Perform search across all resources
 */
async function performSearch(base44: any, query: string, filters: any, userId: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase();

  // Search projects
  try {
    const projects = await base44.entities.Project.list(undefined, 100, { owner_id: userId });
    projects.forEach((project: any) => {
      const score = calculateRelevanceScore(query, project.name, project.description);
      if (score > 0) {
        results.push({
          id: project.id,
          type: 'project',
          title: project.name,
          description: project.description,
          score,
          highlights: extractHighlights(query, project.description || project.name),
          metadata: project,
          url: `/projects/${project.id}`
        });
      }
    });
  } catch (e) {
    console.error('Project search error:', e);
  }

  // Search entities
  try {
    const entities = await base44.entities.Entity.list(undefined, 100);
    entities.forEach((entity: any) => {
      const score = calculateRelevanceScore(query, entity.name, entity.description);
      if (score > 0) {
        results.push({
          id: entity.id,
          type: 'entity',
          title: entity.name,
          description: entity.description,
          score,
          highlights: extractHighlights(query, JSON.stringify(entity.fields)),
          metadata: entity,
          url: `/entities/${entity.id}`
        });
      }
    });
  } catch (e) {
    console.error('Entity search error:', e);
  }

  // Search pages
  try {
    const pages = await base44.entities.Page.list(undefined, 100);
    pages.forEach((page: any) => {
      const searchText = `${page.name} ${page.route} ${page.content}`;
      const score = calculateRelevanceScore(query, page.name, searchText);
      if (score > 0) {
        results.push({
          id: page.id,
          type: 'page',
          title: page.name,
          description: page.route,
          content: page.content?.substring(0, 200),
          score,
          highlights: extractHighlights(query, searchText),
          metadata: page,
          url: `/pages/${page.id}`
        });
      }
    });
  } catch (e) {
    console.error('Page search error:', e);
  }

  // Search components
  try {
    const components = await base44.entities.Component.list(undefined, 100);
    components.forEach((comp: any) => {
      const searchText = `${comp.name} ${comp.code}`;
      const score = calculateRelevanceScore(query, comp.name, searchText);
      if (score > 0) {
        results.push({
          id: comp.id,
          type: 'component',
          title: comp.name,
          description: `React Component`,
          content: comp.code?.substring(0, 200),
          score,
          highlights: extractHighlights(query, comp.code),
          metadata: comp,
          url: `/components/${comp.id}`
        });
      }
    });
  } catch (e) {
    console.error('Component search error:', e);
  }

  // Apply filters
  if (filters) {
    return results.filter(r => {
      if (filters.type && r.type !== filters.type) return false;
      if (filters.projectId && r.metadata?.project_id !== filters.projectId) return false;
      return true;
    });
  }

  return results;
}

/**
 * Calculate relevance score (0-100)
 */
function calculateRelevanceScore(query: string, title: string, content?: string): number {
  const queryLower = query.toLowerCase();
  const titleLower = title?.toLowerCase() || '';
  const contentLower = content?.toLowerCase() || '';

  let score = 0;

  // Exact title match
  if (titleLower === queryLower) score += 100;
  
  // Title contains query
  else if (titleLower.includes(queryLower)) score += 75;
  
  // Title starts with query
  else if (titleLower.startsWith(queryLower)) score += 50;
  
  // Content contains query
  if (contentLower.includes(queryLower)) score += 25;

  // Word boundary matches (more relevant)
  const words = queryLower.split(' ');
  words.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(titleLower)) score += 10;
    if (regex.test(contentLower)) score += 5;
  });

  return Math.min(score, 100);
}

/**
 * Extract highlighted snippets
 */
function extractHighlights(query: string, text: string, maxHighlights = 3): string[] {
  if (!text) return [];

  const highlights: string[] = [];
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  let pos = 0;
  while (highlights.length < maxHighlights) {
    const index = textLower.indexOf(queryLower, pos);
    if (index === -1) break;

    const start = Math.max(0, index - 40);
    const end = Math.min(text.length, index + query.length + 40);
    let snippet = text.substring(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    highlights.push(snippet);
    pos = index + query.length;
  }

  return highlights;
}

/**
 * Generate search suggestions
 */
function generateSearchSuggestions(query: string, results: SearchResult[]): string[] {
  const suggestions = new Set<string>();

  // Extract common terms from results
  results.slice(0, 10).forEach(result => {
    const words = result.title.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3 && !query.toLowerCase().includes(word)) {
        suggestions.add(word);
      }
    });
  });

  return Array.from(suggestions).slice(0, 5);
}

/**
 * Generate facets for filtering
 */
function generateFacets(results: SearchResult[]): any {
  const facets = {
    byType: {},
    byProject: {}
  };

  results.forEach(result => {
    facets.byType[result.type] = (facets.byType[result.type] || 0) + 1;
    if (result.metadata?.project_id) {
      facets.byProject[result.metadata.project_id] = 
        (facets.byProject[result.metadata.project_id] || 0) + 1;
    }
  });

  return facets;
}

/**
 * Generate autocomplete suggestions
 */
async function generateAutocomplete(base44: any, query: string, userId: string): Promise<string[]> {
  const suggestions: string[] = [];

  // Simple implementation - in production, use proper search index
  const queryLower = query.toLowerCase();

  // Common search terms
  const commonTerms = [
    'authentication', 'api', 'database', 'component', 'function',
    'page', 'user', 'admin', 'payment', 'webhook', 'integration'
  ];

  commonTerms.forEach(term => {
    if (term.startsWith(queryLower)) {
      suggestions.push(term);
    }
  });

  return suggestions.slice(0, 5);
}

/**
 * Search in code content
 */
async function searchCode(base44: any, query: string, filters: any, userId: string): Promise<SearchResult[]> {
  // Implementation for code search
  // Would search through function code, component code, etc.
  return [];
}

/**
 * Search files by name
 */
async function searchFiles(base44: any, query: string, filters: any, userId: string): Promise<SearchResult[]> {
  // Implementation for file name search
  return [];
}
