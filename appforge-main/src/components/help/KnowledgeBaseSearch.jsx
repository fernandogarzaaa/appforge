import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, Eye, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = [
  'getting_started',
  'features',
  'troubleshooting',
  'billing',
  'api',
  'integrations'
];

export default function KnowledgeBaseSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: articles } = useQuery({
    queryKey: ['knowledge-base'],
    queryFn: () => base44.entities.KnowledgeBase.filter({ is_published: true })
  });

  const filteredArticles = articles?.filter(article => {
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }) || [];

  const incrementViews = async (articleId) => {
    const article = articles?.find(a => a.id === articleId);
    if (article) {
      await base44.entities.KnowledgeBase.update(articleId, {
        views: (article.views || 0) + 1
      });
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search articles, FAQs, tutorials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            {CATEGORIES.map(cat => (
              <TabsTrigger key={cat} value={cat} className="text-xs capitalize">
                {cat.replace('_', ' ')}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-3">
        {filteredArticles.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No articles found. Try different search terms.</p>
          </Card>
        ) : (
          filteredArticles.map(article => (
            <Card
              key={article.id}
              className="hover:border-slate-400 cursor-pointer transition-all"
              onClick={() => incrementViews(article.id)}
            >
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <CardTitle className="text-base">{article.title}</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="capitalize">
                      {article.category.replace('_', ' ')}
                    </Badge>
                    {article.tags?.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">{article.content}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {article.views || 0} views
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {article.helpful_count || 0} helpful
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}