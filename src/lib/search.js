/**
 * Fuzzy search utilities
 * Implements fuzzy string matching for search results
 */

// Simple fuzzy match score (0-100)
export function fuzzyScore(searchStr, targetStr) {
  const search = searchStr.toLowerCase();
  const target = targetStr.toLowerCase();

  if (!search) return 100; // Empty search matches everything
  if (target.includes(search)) return 100; // Exact substring match
  
  let score = 0;
  let searchIndex = 0;
  let targetIndex = 0;
  let consecutive = 0;

  while (searchIndex < search.length && targetIndex < target.length) {
    if (search[searchIndex] === target[targetIndex]) {
      searchIndex++;
      consecutive++;
      score += 5 + consecutive;
    } else {
      consecutive = 0;
    }
    targetIndex++;
  }

  // Penalty for incomplete matches
  if (searchIndex < search.length) {
    return 0; // Didn't match all characters
  }

  return Math.min(score, 100);
}

export function normalizeQuery(query = '') {
  if (!query) return '';
  return query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.');
}

export function fuzzySearch(query, items = [], field = 'name') {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];

  return items
    .map(item => {
      const value = item?.[field] || '';
      return {
        ...item,
        score: fuzzyScore(normalized, String(value))
      };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function rankSearchResults(results = [], query = '') {
  const normalized = query.toLowerCase();
  return [...results].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    const aIndex = (a.name || '').toLowerCase().indexOf(normalized);
    const bIndex = (b.name || '').toLowerCase().indexOf(normalized);

    if (aIndex === bIndex) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

export function highlightMatches(text = '', query = '') {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');
  if (!regex.test(text)) return text;
  return text.replace(regex, match => `<mark>${match}</mark>`);
}

export function filterByType(items = [], types) {
  if (!types) return items;
  const typeList = Array.isArray(types) ? types : [types];
  if (typeList.length === 0) return [];
  return items.filter(item => typeList.includes(item.type));
}

export function combineSearchResults(resultSets = []) {
  if (!Array.isArray(resultSets) || resultSets.length === 0) return [];
  const flattened = resultSets.flat();
  const seen = new Set();
  const deduped = [];

  flattened.forEach(item => {
    if (!item?.id) return;
    if (seen.has(item.id)) return;
    seen.add(item.id);
    deduped.push(item);
  });

  const hasScore = deduped.some(item => typeof item.score === 'number');
  if (hasScore) {
    deduped.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  return deduped;
}

// Search across projects, functions, and pages
export function performSearch(query, context = {}) {
  const { projects = [], functions = [], pages = [] } = context;

  if (!query || query.trim().length === 0) {
    return { projects: [], functions: [], pages: [] };
  }

  const search = query.toLowerCase();

  // Search projects
  const projectResults = projects
    .map(p => ({
      ...p,
      type: 'project',
      score: Math.max(
        fuzzyScore(query, p.name),
        fuzzyScore(query, p.description || '')
      ),
      icon: '📁'
    }))
    .filter(p => p.score > 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Search functions
  const functionResults = functions
    .map(f => ({
      ...f,
      type: 'function',
      score: Math.max(
        fuzzyScore(query, f.name),
        fuzzyScore(query, f.description || '')
      ),
      icon: '⚙️'
    }))
    .filter(f => f.score > 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Search pages
  const pageResults = pages
    .map(pg => ({
      ...pg,
      type: 'page',
      score: fuzzyScore(query, pg.name),
      icon: '📄'
    }))
    .filter(pg => pg.score > 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    projects: projectResults,
    functions: functionResults,
    pages: pageResults,
    total: projectResults.length + functionResults.length + pageResults.length
  };
}
