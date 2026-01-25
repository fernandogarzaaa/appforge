import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Twitter, Facebook, Instagram, Linkedin, MessageCircle, 
  Calendar, Send, Image, Video, TrendingUp, Users, Heart,
  Eye, Share2, Plus, Edit, Trash2, BarChart3, Clock, Zap,
  Sparkles, Lightbulb, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { format } from 'date-fns';

const platforms = [
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: '#1DA1F2', connected: false },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#4267B2', connected: false },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F', connected: false },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0077B5', connected: false },
  { id: 'tiktok', name: 'TikTok', icon: MessageCircle, color: '#000000', connected: false }
];

const postTemplates = [
  { id: 'product-launch', name: 'Product Launch', content: '🚀 Exciting news! Introducing [Product Name]\n\n[Key Features]\n\n✨ Available now at [Link]\n\n#ProductLaunch #Innovation' },
  { id: 'sale', name: 'Sale Announcement', content: '🔥 FLASH SALE! 🔥\n\n[Discount]% OFF on [Product/Category]\n\n⏰ Limited time only!\n🛒 Shop now: [Link]\n\n#Sale #Discount' },
  { id: 'testimonial', name: 'Customer Testimonial', content: '💬 What our customers are saying:\n\n"[Testimonial]"\n\n- [Customer Name]\n\n#CustomerLove #Testimonial' },
  { id: 'tips', name: 'Tips & Tricks', content: '💡 Pro Tip:\n\n[Tip content]\n\nTry it out and let us know your results!\n\n#Tips #HowTo' },
  { id: 'behind-scenes', name: 'Behind The Scenes', content: '👀 Behind the scenes at [Company]\n\n[Description of what you\'re showing]\n\n#BTS #TeamWork' },
  { id: 'milestone', name: 'Company Milestone', content: '🎉 We\'re celebrating! [Milestone Achievement]\n\nThank you to everyone who made this possible!\n\n#Milestone #Celebration' }
];

export default function SocialMediaHub() {
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);
  const [scheduledDate, setScheduledDate] = useState(null);
  const [newPost, setNewPost] = useState({
    content: '',
    platforms: [],
    scheduled_time: null,
    media_urls: [],
    status: 'draft'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentIdeas, setContentIdeas] = useState([]);
  const [showIdeasDialog, setShowIdeasDialog] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');

  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['social-posts', projectId],
    queryFn: async () => {
      // Mock data for demo
      return [
        { id: 1, content: 'Check out our new feature!', platforms: ['twitter', 'linkedin'], scheduled_time: new Date().toISOString(), status: 'scheduled', engagement: { likes: 45, shares: 12, views: 230 } },
        { id: 2, content: 'Behind the scenes at our office', platforms: ['instagram', 'facebook'], scheduled_time: null, status: 'published', engagement: { likes: 128, shares: 34, views: 890 } }
      ];
    },
    enabled: !!projectId
  });

  const { data: analytics = {} } = useQuery({
    queryKey: ['social-analytics', projectId],
    queryFn: async () => ({
      total_posts: 47,
      total_engagement: 2340,
      total_reach: 15600,
      engagement_rate: 15.2
    }),
    enabled: !!projectId
  });

  const connectPlatform = (platform) => {
    setConnectedPlatforms([...connectedPlatforms, platform.id]);
    toast.success(`${platform.name} connected successfully`);
    setShowConnectDialog(false);
  };

  const createPost = () => {
    if (!newPost.content.trim() || newPost.platforms.length === 0) {
      toast.error('Add content and select at least one platform');
      return;
    }

    toast.success('Post scheduled successfully');
    setShowPostDialog(false);
    setNewPost({ content: '', platforms: [], scheduled_time: null, media_urls: [], status: 'draft' });
    setScheduledDate(null);
  };

  const togglePlatform = (platformId) => {
    if (newPost.platforms.includes(platformId)) {
      setNewPost({ ...newPost, platforms: newPost.platforms.filter(p => p !== platformId) });
    } else {
      setNewPost({ ...newPost, platforms: [...newPost.platforms, platformId] });
    }
  };

  const applyTemplate = (template) => {
    setNewPost({ ...newPost, content: template.content });
    toast.success('Template applied');
  };

  const generateAIPost = async (prompt) => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create an engaging social media post about: ${prompt}
        
        Requirements:
        - Make it catchy and engaging
        - Include relevant emojis
        - Add 3-5 hashtags
        - Keep it under 280 characters for Twitter compatibility
        - Make it professional yet friendly`,
        response_json_schema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            hashtags: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      
      setNewPost({ ...newPost, content: result.content });
      toast.success('AI post generated!');
    } catch (error) {
      toast.error('Failed to generate post');
    } finally {
      setIsGenerating(false);
    }
  };

  const optimizeContent = async () => {
    if (!newPost.content.trim()) {
      toast.error('Add content first');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Optimize this social media post for maximum engagement:
        
        "${newPost.content}"
        
        Improvements to make:
        - Better hook/opening
        - More engaging language
        - Add relevant emojis
        - Optimize hashtags
        - Keep the core message
        - Make it more actionable`,
        response_json_schema: {
          type: 'object',
          properties: {
            optimized_content: { type: 'string' },
            improvements: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      
      setNewPost({ ...newPost, content: result.optimized_content });
      toast.success('Content optimized!');
    } catch (error) {
      toast.error('Failed to optimize content');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateContentIdeas = async () => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 6 creative social media content ideas for a business.
        
        For each idea provide:
        - title: catchy title
        - description: brief description
        - content_type: (tip, promotion, story, question, announcement, educational)
        - sample_post: example post text with emojis
        
        Make them diverse and engaging.`,
        response_json_schema: {
          type: 'object',
          properties: {
            ideas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  content_type: { type: 'string' },
                  sample_post: { type: 'string' }
                }
              }
            }
          }
        }
      });
      
      setContentIdeas(result.ideas || []);
      setShowIdeasDialog(true);
    } catch (error) {
      toast.error('Failed to generate ideas');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Share2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Project</h2>
          <p className="text-gray-500">Choose a project to manage social media</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Social Media Hub</h1>
          <p className="text-gray-500">Automate marketing across all platforms</p>
        </div>
        <Button onClick={() => setShowPostDialog(true)} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Send className="w-5 h-5 text-indigo-600" />
                  <Badge variant="outline" className="text-green-600">+12%</Badge>
                </div>
                <div className="text-2xl font-bold">{analytics.total_posts || 0}</div>
                <p className="text-sm text-gray-600">Total Posts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="w-5 h-5 text-pink-600" />
                  <Badge variant="outline" className="text-green-600">+8%</Badge>
                </div>
                <div className="text-2xl font-bold">{analytics.total_engagement || 0}</div>
                <p className="text-sm text-gray-600">Engagement</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <Badge variant="outline" className="text-green-600">+15%</Badge>
                </div>
                <div className="text-2xl font-bold">{analytics.total_reach || 0}</div>
                <p className="text-sm text-gray-600">Total Reach</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <Badge variant="outline" className="text-green-600">+5%</Badge>
                </div>
                <div className="text-2xl font-bold">{analytics.engagement_rate || 0}%</div>
                <p className="text-sm text-gray-600">Engagement Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Connected Platforms */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Platforms</CardTitle>
              <CardDescription>Manage your social media accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {platforms.map((platform) => {
                  const isConnected = connectedPlatforms.includes(platform.id);
                  const PlatformIcon = platform.icon;
                  return (
                    <Card key={platform.id} className={isConnected ? 'border-2' : ''} style={isConnected ? { borderColor: platform.color } : {}}>
                      <CardContent className="p-4 text-center">
                        <div 
                          className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                          style={{ backgroundColor: `${platform.color}20` }}
                        >
                          <PlatformIcon className="w-6 h-6" style={{ color: platform.color }} />
                        </div>
                        <p className="font-medium text-sm mb-2">{platform.name}</p>
                        {isConnected ? (
                          <Badge className="bg-green-100 text-green-700 text-xs">Connected</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPlatform(platform);
                              setShowConnectDialog(true);
                            }}
                            className="text-xs"
                          >
                            Connect
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowPostDialog(true)}>
              <CardContent className="p-6 text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                <h3 className="font-semibold mb-1">Quick Post</h3>
                <p className="text-sm text-gray-600">Post immediately to all platforms</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={generateContentIdeas}>
              <CardContent className="p-6 text-center">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold mb-1">AI Content Ideas</h3>
                <p className="text-sm text-gray-600">Generate creative post ideas</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold mb-1">Schedule Campaign</h3>
                <p className="text-sm text-gray-600">Plan content in advance</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold mb-1">View Reports</h3>
                <p className="text-sm text-gray-600">Analyze performance metrics</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="posts">
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm mb-3">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {post.engagement?.likes || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          {post.engagement?.shares || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.engagement?.views || 0}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={post.status === 'published' ? 'default' : 'outline'}>
                        {post.status}
                      </Badge>
                      <div className="flex gap-1">
                        {post.platforms.map((p) => {
                          const platform = platforms.find(pl => pl.id === p);
                          if (!platform) return null;
                          const Icon = platform.icon;
                          return (
                            <div key={p} className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${platform.color}20` }}>
                              <Icon className="w-3 h-3" style={{ color: platform.color }} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Content Calendar</h3>
                <p className="text-gray-500">View and manage scheduled posts</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Platform Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {platforms.slice(0, 3).map((platform, i) => (
                  <div key={platform.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <platform.icon className="w-5 h-5" style={{ color: platform.color }} />
                      <span className="font-medium text-sm">{platform.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{[1240, 890, 560][i]}</div>
                      <div className="text-xs text-gray-500">engagements</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Best Time to Post</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Weekdays</span>
                    <Badge>9-11 AM, 2-4 PM</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Weekends</span>
                    <Badge>10 AM - 12 PM</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Peak Day</span>
                    <Badge variant="outline">Tuesday</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Social Media Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block">AI Post Generator</Label>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Describe what you want to post about..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      generateAIPost(e.currentTarget.value);
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling;
                    if (input.value.trim()) generateAIPost(input.value);
                  }}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Post Templates</Label>
              <div className="grid grid-cols-3 gap-2">
                {postTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template)}
                    className="text-xs"
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Content</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={optimizeContent}
                  disabled={isGenerating || !newPost.content.trim()}
                  className="text-xs"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Optimize with AI
                </Button>
              </div>
              <Textarea
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder="What's on your mind?"
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{newPost.content.length} characters</p>
            </div>
            <div>
              <Label className="mb-2 block">Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => {
                  const isSelected = newPost.platforms.includes(platform.id);
                  const PlatformIcon = platform.icon;
                  return (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                        isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <PlatformIcon className="w-4 h-4" style={{ color: platform.color }} />
                      <span className="text-sm">{platform.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Schedule (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="w-4 h-4 mr-2" />
                    {scheduledDate ? format(scheduledDate, 'PPP p') : 'Post immediately'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarPicker
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostDialog(false)}>Cancel</Button>
            <Button onClick={createPost}>
              {scheduledDate ? 'Schedule Post' : 'Post Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connect Platform Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPlatform && <selectedPlatform.icon className="w-5 h-5" style={{ color: selectedPlatform.color }} />}
              Connect {selectedPlatform?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-600">
              Authorize AppForge to post on your behalf
            </p>
            <div className="space-y-2">
              <Label>Access Token / API Key</Label>
              <Input placeholder="Enter your API credentials" type="password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>Cancel</Button>
            <Button onClick={() => selectedPlatform && connectPlatform(selectedPlatform)}>
              Connect Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Ideas Dialog */}
      <Dialog open={showIdeasDialog} onOpenChange={setShowIdeasDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-600" />
              AI Content Ideas
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
            {contentIdeas.map((idea, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                setNewPost({ ...newPost, content: idea.sample_post });
                setShowIdeasDialog(false);
                setShowPostDialog(true);
                toast.success('Idea applied to post');
              }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm">{idea.title}</CardTitle>
                    <Badge variant="outline" className="text-xs">{idea.content_type}</Badge>
                  </div>
                  <CardDescription className="text-xs">{idea.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{idea.sample_post}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIdeasDialog(false)}>Close</Button>
            <Button onClick={generateContentIdeas} disabled={isGenerating}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Generate New Ideas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}