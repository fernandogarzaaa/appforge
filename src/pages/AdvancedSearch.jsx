import { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, Code, FileText, Folder, Zap, Star, Database } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { SearchAnalytics } from '@/utils/searchAnalytics';
import { searchIndexManager } from '@/utils/searchIndexing';

export default function AdvancedSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    project: ''
  });
  const [searchMode, setSearchMode] = useState('general');
  const [sortMode, setSortMode] = useState('relevance');
  const [highlightMatches, setHighlightMatches] = useState(true);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('appforge_search_history') || '[]');
    } catch {
      return [];
    }
  });
  const [savedSearches, setSavedSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('appforge_saved_searches') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    localStorage.setItem('appforge_search_history', JSON.stringify(recentSearches.slice(0, 10)));
  }, [recentSearches]);

  useEffect(() => {
    localStorage.setItem('appforge_saved_searches', JSON.stringify(savedSearches.slice(0, 10)));
  }, [savedSearches]);

  // Search
  const { data: results, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, filters, searchMode],
    queryFn: async () => {
      if (!debouncedQuery) return null;

      const startTime = performance.now();

      // Try local search index first
      const localIndex = searchIndexManager.getIndex('functions');
      const localResults = localIndex.search(debouncedQuery, {
        fuzzy: true,
        maxDistance: 2,
        limit: 50,
        filters: filters.type ? { type: filters.type } : {}
      });

      // If local index has results, use them
      if (localResults.total > 0) {
        const responseTime = performance.now() - startTime;
        
        // Log to analytics
        SearchAnalytics.logQuery({
          query: debouncedQuery,
          resultCount: localResults.total,
          responseTime,
          filters,
          userId: 'current-user'
        });

        return {
          results: localResults.results.map(r => r.document),
          total: localResults.total
        };
      }

      // Fallback to API search
      const response = await base44.functions.execute('advancedSearch', {
        action: 'search',
        query: debouncedQuery,
        filters,
        limit: 50
      });

      const responseTime = performance.now() - startTime;

      // Log to analytics
      SearchAnalytics.logQuery({
        query: debouncedQuery,
        resultCount: response.data?.results?.length || 0,
        responseTime,
        filters,
        userId: 'current-user'
      });

      return response.data;
    },
    enabled: debouncedQuery.length >= 2
  });

  // Autocomplete
  const { data: suggestions } = useQuery({
    queryKey: ['autocomplete', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return null;

      // Try local index suggestions first
      const localIndex = searchIndexManager.getIndex('functions');
      const localSuggestions = localIndex.getSuggestions(debouncedQuery, 5);
      
      if (localSuggestions.length > 0) {
        return localSuggestions;
      }

      // Fallback to API
      const response = await base44.functions.execute('advancedSearch', {
        action: 'autocomplete',
        query: debouncedQuery
      });
      return response.data;
    },
    enabled: debouncedQuery.length >= 2
  });

  // Facets
  const { data: facets } = useQuery({
    queryKey: ['search-facets'],
    queryFn: async () => {
      const response = await base44.functions.execute('advancedSearch', {
        action: 'getFacets'
      });
      return response.data;
    }
  });

  const getTypeIcon = (type) => {
    const icons = {
      project: Folder,
      entity: FileText,
      page: FileText,
      component: Code,
      function: Zap
    };
    return icons[type] || FileText;
  };

  const getRelevanceColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const sortedResults = useMemo(() => {
    if (!results?.results) return [];
    const base = [...results.results];
    if (sortMode === 'recent') {
      return base.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
    if (sortMode === 'alphabetical') {
      return base.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
    }
    return base.sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [results, sortMode]);

  const handleSearchSelect = (value) => {
    setQuery(value);
    if (value && !recentSearches.includes(value)) {
      setRecentSearches((prev) => [value, ...prev].slice(0, 10));
    }
  };

  const handleSaveSearch = () => {
    if (!debouncedQuery) return;
    const entry = {
      query: debouncedQuery,
      filters,
      searchMode,
      savedAt: Date.now(),
    };
    setSavedSearches((prev) => [entry, ...prev.filter((s) => s.query !== debouncedQuery)].slice(0, 10));
  };

  // Load sample data into search index
  const loadSampleData = () => {
    const index = searchIndexManager.getIndex('functions');
    
    const sampleFunctions = [
      { id: 'auth', name: 'User Authentication', description: 'Handle user login and authentication', tags: ['security', 'auth', 'user'], type: 'function' },
      { id: 'payment', name: 'Payment Processing', description: 'Process credit card payments and subscriptions', tags: ['payment', 'stripe', 'billing'], type: 'function' },
      { id: 'email', name: 'Email Service', description: 'Send transactional emails and notifications', tags: ['email', 'notification', 'smtp'], type: 'function' },
      { id: 'analytics', name: 'Analytics Dashboard', description: 'Track user behavior and generate reports', tags: ['analytics', 'metrics', 'dashboard'], type: 'function' },
      { id: 'api', name: 'API Integration', description: 'Integrate with third-party APIs and services', tags: ['api', 'integration', 'rest'], type: 'function' },
    ];

    sampleFunctions.forEach(fn => {
      index.addDocument(fn.id, fn, ['name', 'description', 'tags']);
    });

    alert(`Loaded ${sampleFunctions.length} sample functions into search index`);
  };

  const getIndexStats = () => {
    const index = searchIndexManager.getIndex('functions');
    const stats = index.getStats();
    alert(`Index Stats:\nDocuments: ${stats.totalDocuments}\nTerms: ${stats.totalTerms}\nCache: ${stats.cacheSize}\nAvg Terms/Doc: ${stats.avgTermsPerDocument}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Advanced Search & Discovery</h1>
        <p className="text-muted-foreground">
          Full-text search across projects, entities, pages, components, and functions with relevance scoring.
        </p>
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={loadSampleData}>
            <Database className="w-4 h-4 mr-2" />
            Load Sample Data
          </Button>
          <Button size="sm" variant="outline" onClick={getIndexStats}>
            View Index Stats
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for anything... (projects, entities, code, pages)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 text-lg h-12"
            />
            <Button
              size="sm"
              variant="outline"
              className="absolute right-3 top-2.5"
              onClick={handleSaveSearch}
              disabled={!debouncedQuery}
            >
              Save
            </Button>
          </div>

          {/* Search Modes */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={searchMode === 'general' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchMode('general')}
            >
              General Search
            </Button>
            <Button
              variant={searchMode === 'code' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchMode('code')}
            >
              <Code className="w-4 h-4 mr-2" />
              Code Search
            </Button>
            <Button
              variant={searchMode === 'files' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchMode('files')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Files Only
            </Button>
          </div>

          {/* Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <div className="border rounded-lg p-2 space-y-1">
              <div className="text-xs text-muted-foreground mb-1">Suggestions:</div>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  className="w-full text-left px-2 py-1 hover:bg-muted rounded text-sm"
                  onClick={() => handleSearchSelect(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {(recentSearches.length > 0 || savedSearches.length > 0) && (
            <div className="grid md:grid-cols-2 gap-3 mt-4">
              {recentSearches.length > 0 && (
                <div className="border rounded-lg p-2">
                  <div className="text-xs text-muted-foreground mb-2">Recent Searches</div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((item) => (
                      <Badge
                        key={item}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => handleSearchSelect(item)}
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {savedSearches.length > 0 && (
                <div className="border rounded-lg p-2">
                  <div className="text-xs text-muted-foreground mb-2">Saved Searches</div>
                  <div className="flex flex-wrap gap-2">
                    {savedSearches.map((item) => (
                      <Badge
                        key={`${item.query}-${item.savedAt}`}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => {
                          setFilters(item.filters);
                          setSearchMode(item.searchMode);
                          handleSearchSelect(item.query);
                        }}
                      >
                        {item.query}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Type</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="project">Projects</option>
                <option value="entity">Entities</option>
                <option value="page">Pages</option>
                <option value="component">Components</option>
                <option value="function">Functions</option>
              </select>
            </div>

            {facets && (
              <>
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Projects ({facets.byProject?.length || 0})
                  </label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {facets.byProject?.slice(0, 10).map((project, idx) => (
                      <button
                        key={idx}
                        className="w-full text-left px-2 py-1 hover:bg-muted rounded text-sm flex justify-between"
                        onClick={() => setFilters({ ...filters, project: project.value })}
                      >
                        <span className="truncate">{project.value}</span>
                        <Badge variant="secondary" className="text-xs">{project.count}</Badge>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Types
                  </label>
                  <div className="space-y-1">
                    {facets.byType?.map((type, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{type.value}</span>
                        <Badge variant="secondary" className="text-xs">{type.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setFilters({ type: '', project: '' })}
            >
              Clear Filters
            </Button>

            <div className="pt-2 border-t">
              <label className="text-sm font-semibold mb-2 block">Sort</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
              >
                <option value="relevance">Relevance</option>
                <option value="recent">Most Recent</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={highlightMatches}
                onChange={(e) => setHighlightMatches(e.target.checked)}
                className="accent-blue-600"
              />
              Highlight matches
            </label>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Results
              </span>
              {results && (
                <Badge variant="secondary">
                  {results.total} results ({(results.searchTime || 0).toFixed(2)}ms)
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!query && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start typing to search across your entire workspace</p>
                <p className="text-sm mt-2">Search for projects, entities, pages, components, or code</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Searching...</p>
              </div>
            )}

            {results && results.results && results.results.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-2">Try different keywords or adjust your filters</p>
              </div>
            )}

            <div className="space-y-3">
              {sortedResults.map((result, idx) => {
                const Icon = getTypeIcon(result.type);
                return (
                  <div key={idx} className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <h3 className="font-semibold">{result.title || result.name}</h3>
                        <Badge variant="outline" className="text-xs">{result.type}</Badge>
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${getRelevanceColor(result.score)}`}>
                        <Star className="w-4 h-4 fill-current" />
                        <span>{result.score}%</span>
                      </div>
                    </div>

                    {result.description && (
                      <p className="text-sm text-muted-foreground mb-2">{result.description}</p>
                    )}

                    {result.highlights && result.highlights.length > 0 && (
                      <div className="space-y-1">
                        {result.highlights.map((highlight, hIdx) => (
                          <div 
                            key={hIdx} 
                            className="text-xs font-mono bg-muted px-2 py-1 rounded"
                            dangerouslySetInnerHTML={{ 
                              __html: highlightMatches
                                ? highlight.replace(
                                    new RegExp(debouncedQuery, 'gi'),
                                    match => `<mark class="bg-yellow-200">${match}</mark>`
                                  )
                                : highlight
                            }}
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      {result.projectId && <span>Project: {result.projectId}</span>}
                      {result.path && <span>Path: {result.path}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
