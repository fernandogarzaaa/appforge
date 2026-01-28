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
