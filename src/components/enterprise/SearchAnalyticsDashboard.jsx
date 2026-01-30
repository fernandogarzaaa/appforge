import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  TrendingUp, 
  AlertCircle, 
  Download, 
  BarChart3,
  Clock,
  Filter,
  Zap
} from 'lucide-react';
import { SearchAnalytics } from '@/utils/searchAnalytics';

/**
 * SearchAnalyticsDashboard - Comprehensive search analytics and insights
 */
export function SearchAnalyticsDashboard() {
  const [metrics, setMetrics] = useState(SearchAnalytics.getMetrics());
  const [popularSearches, setPopularSearches] = useState([]);
  const [zeroResults, setZeroResults] = useState([]);
  const [trends, setTrends] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [filterUsage, setFilterUsage] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('day');

  // Subscribe to analytics updates
  useEffect(() => {
    const unsubscribe = SearchAnalytics.subscribe?.(() => {
      refreshData();
    }) || (() => {});
    
    refreshData();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [selectedPeriod]);

  const refreshData = () => {
    setMetrics(SearchAnalytics.getMetrics());
    setPopularSearches(SearchAnalytics.getPopularSearches(10));
    setZeroResults(SearchAnalytics.getZeroResultSearches(10));
    setTrends(SearchAnalytics.getTrends(selectedPeriod));
    setRecentSearches(SearchAnalytics.getRecentSearches(10));
    setFilterUsage(SearchAnalytics.getFilterUsage());
  };

  const handleExport = () => {
    const data = SearchAnalytics.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-analytics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Clear all analytics data? This cannot be undone.')) {
      SearchAnalytics.clearData();
      refreshData();
    }
  };

  // Generate sample data for demo
  const generateSampleData = () => {
    const sampleQueries = [
      { query: 'user authentication', resultCount: 45, responseTime: 120 },
      { query: 'dashboard', resultCount: 32, responseTime: 95 },
      { query: 'api integration', resultCount: 28, responseTime: 150 },
      { query: 'payment processing', resultCount: 0, responseTime: 85 },
      { query: 'email templates', resultCount: 18, responseTime: 110 },
      { query: 'deployment guide', resultCount: 12, responseTime: 130 },
      { query: 'database schema', resultCount: 25, responseTime: 105 },
      { query: 'webhooks', resultCount: 15, responseTime: 90 },
      { query: 'rate limiting', resultCount: 0, responseTime: 100 },
      { query: 'analytics dashboard', resultCount: 38, responseTime: 125 }
    ];

    sampleQueries.forEach(query => {
      SearchAnalytics.logQuery({
        ...query,
        filters: { category: 'all', status: 'active' },
        userId: 'demo-user'
      });
    });

    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Search Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Track search behavior and optimize search experience
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateSampleData}>
            <Zap className="h-4 w-4 mr-2" />
            Generate Sample Data
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="destructive" onClick={handleClear}>
            Clear Data
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalQueries || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.uniqueQueries || 0} unique queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.avgResponseTime?.toFixed(0) || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average query duration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.conversionRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Users clicking results
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Zero Results</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.zeroResultCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.zeroResultRate || 0}% of all searches
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="popular" className="space-y-4">
        <TabsList>
          <TabsTrigger value="popular">Popular Searches</TabsTrigger>
          <TabsTrigger value="zero-results">Zero Results</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="filters">Filter Usage</TabsTrigger>
        </TabsList>

        {/* Popular Searches */}
        <TabsContent value="popular" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Search Queries</CardTitle>
              <CardDescription>
                Most frequently searched terms by users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {popularSearches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No search data yet. Generate sample data to see analytics.
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {popularSearches.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <div className="font-medium">{item.query}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.count} searches ({item.percentage}%)
                            </div>
                          </div>
                        </div>
                        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zero Results */}
        <TabsContent value="zero-results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zero-Result Searches</CardTitle>
              <CardDescription>
                Queries that returned no results - optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {zeroResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No zero-result searches found
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {zeroResults.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border bg-destructive/5"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                          <div>
                            <div className="font-medium">{item.query}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.count} failed {item.count === 1 ? 'search' : 'searches'}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Add Synonym
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Search Trends</CardTitle>
                  <CardDescription>
                    Search volume and performance over time
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {['hour', 'day', 'week', 'month'].map(period => (
                    <Button
                      key={period}
                      size="sm"
                      variant={selectedPeriod === period ? 'default' : 'outline'}
                      onClick={() => setSelectedPeriod(period)}
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {trends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No trend data available
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-[300px] flex items-end gap-1">
                    {trends.map((point, index) => (
                      <div
                        key={index}
                        className="flex-1 bg-primary rounded-t"
                        style={{
                          height: `${Math.max((point.count / Math.max(...trends.map(t => t.count))) * 100, 2)}%`
                        }}
                        title={`${point.count} searches`}
                      />
                    ))}
                  </div>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {trends.map((point, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm p-2 rounded border"
                        >
                          <span className="text-muted-foreground">
                            {new Date(point.timestamp).toLocaleString()}
                          </span>
                          <div className="flex gap-4">
                            <span>{point.count} searches</span>
                            <span className="text-muted-foreground">
                              {point.avgResponseTime.toFixed(0)}ms avg
                            </span>
                            {point.zeroResults > 0 && (
                              <Badge variant="destructive">{point.zeroResults} zero</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Searches */}
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Searches</CardTitle>
              <CardDescription>
                Latest search activity in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentSearches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent searches
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{search.query}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(search.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={search.resultCount > 0 ? 'default' : 'destructive'}>
                            {search.resultCount} results
                          </Badge>
                          {search.converted && (
                            <Badge variant="outline">Converted</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filter Usage */}
        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter Usage Statistics</CardTitle>
              <CardDescription>
                How users refine their searches with filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filterUsage.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No filter usage data
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {filterUsage.map((filterData, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            <span className="font-medium capitalize">{filterData.filter}</span>
                          </div>
                          <Badge>{filterData.count} uses</Badge>
                        </div>
                        <div className="space-y-1">
                          {filterData.topValues.map((value, vIndex) => (
                            <div key={vIndex} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{value.value}</span>
                              <span>{value.count} times</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SearchAnalyticsDashboard;
