import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SupportChatbot from '@/components/support/SupportChatbot';
import { 
  MessageCircle, BookOpen, Ticket, Search, 
  Clock, CheckCircle, AlertCircle, Eye
} from 'lucide-react';

export default function Support() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: tickets = [] } = useQuery({
    queryKey: ['support-tickets', user?.email],
    queryFn: () => base44.entities.SupportTicket.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user?.email
  });

  const { data: articles = [] } = useQuery({
    queryKey: ['knowledge-base'],
    queryFn: () => base44.entities.KnowledgeBase.filter({ is_published: true })
  });

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusIcons = {
    open: <Clock className="w-4 h-4 text-blue-600" />,
    in_progress: <AlertCircle className="w-4 h-4 text-orange-600" />,
    resolved: <CheckCircle className="w-4 h-4 text-green-600" />
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Support Center</h1>
        <p className="text-gray-500">Get help from our AI assistant or browse knowledge base</p>
      </div>

      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList>
          <TabsTrigger value="chat">
            <MessageCircle className="w-4 h-4 mr-2" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="kb">
            <BookOpen className="w-4 h-4 mr-2" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket className="w-4 h-4 mr-2" />
            My Tickets ({tickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="h-[calc(100vh-16rem)]">
          {user && <SupportChatbot user={user} />}
        </TabsContent>

        <TabsContent value="kb">
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search knowledge base..."
                className="pl-10 h-12 text-base"
              />
            </div>

            <div className="grid gap-4">
              {filteredArticles.map(article => (
                <Card key={article.id} className="hover:shadow-lg transition-all cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{article.title}</CardTitle>
                        <p className="text-sm text-gray-600 line-clamp-2">{article.content}</p>
                      </div>
                      <Badge variant="outline">{article.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.views} views
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">👍 {article.helpful_count}</span>
                        <span className="text-red-600">👎 {article.not_helpful_count}</span>
                      </div>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex gap-1">
                          {article.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredArticles.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No articles found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tickets">
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No support tickets yet</p>
                  <p className="text-sm text-gray-400 mt-2">Start a chat with AI assistant to create a ticket</p>
                </CardContent>
              </Card>
            ) : (
              tickets.map(ticket => (
                <Card key={ticket.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{ticket.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={
                          ticket.status === 'resolved' ? 'bg-green-600' :
                          ticket.status === 'in_progress' ? 'bg-orange-600' :
                          'bg-blue-600'
                        }>
                          {statusIcons[ticket.status]}
                          <span className="ml-2">{ticket.status}</span>
                        </Badge>
                        <Badge variant="outline">{ticket.priority}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Created {new Date(ticket.created_date).toLocaleDateString()}</span>
                        <span>{ticket.messages?.length || 0} messages</span>
                        {ticket.assigned_to && (
                          <span className="text-blue-600">Assigned to agent</span>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}