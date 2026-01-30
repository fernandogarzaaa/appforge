import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
// Tab components not used in this file
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Activity, 
  MessageSquare, 
  AtSign,
  Send,
  TrendingUp
} from 'lucide-react';
import { UserPresence, ActivityFeed, Mentions, CollaborativeRoom } from '@/utils/collaboration';

/**
 * TeamCollaborationDashboard - Real-time team collaboration center
 */
export function TeamCollaborationDashboard() {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [message, setMessage] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');

  const currentUserId = 'demo-user';
  const currentUserName = 'Demo User';

  // Subscribe to updates
  useEffect(() => {
    const unsubscribe = UserPresence.subscribe(() => {
      refreshData();
    });

    // Set current user online
    UserPresence.setOnline(currentUserId, {
      name: currentUserName,
      currentPage: '/collaboration',
      avatar: '👤'
    });

    refreshData();
    return () => {
      UserPresence.setOffline(currentUserId);
      unsubscribe();
    };
  }, []);

  const refreshData = () => {
    setOnlineUsers(UserPresence.getOnlineUsers());
    setActivities(ActivityFeed.getActivities({ limit: 50 }));
    setMentions(Mentions.getMentions(currentUserId));
    setRooms(CollaborativeRoom.getAllRooms());
  };

  const handleJoinRoom = (roomId) => {
    CollaborativeRoom.join(roomId, currentUserId, {
      name: currentUserName,
      avatar: '👤'
    });
    setSelectedRoom(roomId);
    refreshData();
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedRoom) return;

    CollaborativeRoom.sendMessage(selectedRoom, currentUserId, message);
    setMessage('');
    refreshData();
  };

  const handleCreateMention = () => {
    Mentions.create({
      fromUserId: currentUserId,
      fromUserName: currentUserName,
      toUserId: 'user-2',
      context: 'comment',
      message: 'Check out the new feature!',
      link: '/projects/123'
    });
    refreshData();
  };

  const handleLogActivity = () => {
    ActivityFeed.logActivity({
      userId: currentUserId,
      userName: currentUserName,
      type: 'edit',
      action: 'Updated dashboard component',
      target: 'Dashboard.jsx',
      metadata: { projectId: 'demo-project' }
    });
    refreshData();
  };

  const generateSampleData = () => {
    // Add sample users
    ['Alice', 'Bob', 'Charlie', 'Diana'].forEach((name, i) => {
      UserPresence.setOnline(`user-${i + 1}`, {
        name,
        currentPage: '/projects',
        currentProject: 'demo-project',
        avatar: ['👩', '👨', '🧑', '👩‍💼'][i]
      });
    });

    // Add sample activities
    const activities = [
      { type: 'create', action: 'Created new project', target: 'E-commerce App' },
      { type: 'edit', action: 'Updated user authentication', target: 'auth.js' },
      { type: 'deploy', action: 'Deployed to production', target: 'v2.1.0' },
      { type: 'comment', action: 'Commented on pull request', target: 'PR #42' },
      { type: 'delete', action: 'Removed deprecated code', target: 'legacy.js' }
    ];

    activities.forEach((act, i) => {
      ActivityFeed.logActivity({
        userId: `user-${(i % 4) + 1}`,
        userName: ['Alice', 'Bob', 'Charlie', 'Diana'][i % 4],
        ...act,
        metadata: { projectId: 'demo-project' }
      });
    });

    // Create sample room
    CollaborativeRoom.join('general', currentUserId, {
      name: currentUserName,
      avatar: '👤'
    });

    refreshData();
  };

  const getActivityIcon = (type) => {
    const icons = {
      create: '➕',
      edit: '✏️',
      delete: '🗑️',
      comment: '💬',
      deploy: '🚀'
    };
    return icons[type] || '📝';
  };

  const getStatusColor = (status) => {
    const colors = {
      online: 'bg-green-500',
      away: 'bg-yellow-500',
      offline: 'bg-gray-400'
    };
    return colors[status] || 'bg-gray-400';
  };

  const filteredActivities = activityFilter === 'all' 
    ? activities 
    : activities.filter(a => a.type === activityFilter);

  const roomData = selectedRoom ? CollaborativeRoom.getRoom(selectedRoom) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Team Collaboration
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time presence, activity tracking, and team communication
          </p>
        </div>
        <Button onClick={generateSampleData}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Generate Sample Data
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Online Now</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineUsers.length}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activities Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ActivityFeed.getStats().today}</div>
            <p className="text-xs text-muted-foreground">Team actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unread Mentions</CardTitle>
            <AtSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Mentions.getUnreadCount(currentUserId)}
            </div>
            <p className="text-xs text-muted-foreground">Need your attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Rooms</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.length}</div>
            <p className="text-xs text-muted-foreground">Collaborative spaces</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Presence & Rooms */}
        <div className="space-y-6">
          {/* Online Users */}
          <Card>
            <CardHeader>
              <CardTitle>Team Presence</CardTitle>
              <CardDescription>Who's online right now</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {onlineUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users online
                  </div>
                ) : (
                  <div className="space-y-2">
                    {onlineUsers.map(user => (
                      <div
                        key={user.userId}
                        className="flex items-center gap-3 p-2 rounded-lg border"
                      >
                        <div className="relative">
                          <div className="text-2xl">{user.avatar || '👤'}</div>
                          <div
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.currentPage || 'Idle'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Rooms */}
          <Card>
            <CardHeader>
              <CardTitle>Collaborative Rooms</CardTitle>
              <CardDescription>Shared workspaces</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['general', 'development', 'design'].map(roomId => (
                  <Button
                    key={roomId}
                    variant={selectedRoom === roomId ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => handleJoinRoom(roomId)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    #{roomId}
                    <Badge variant="secondary" className="ml-auto">
                      {CollaborativeRoom.getRoom(roomId)?.users.size || 0}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
            <CardDescription>Recent team actions</CardDescription>
            <div className="flex gap-2 mt-2">
              {['all', 'create', 'edit', 'deploy', 'comment'].map(filter => (
                <Button
                  key={filter}
                  size="sm"
                  variant={activityFilter === filter ? 'default' : 'outline'}
                  onClick={() => setActivityFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No activities yet
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredActivities.map(activity => (
                    <div
                      key={activity.id}
                      className="flex gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium">{activity.userName}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-sm">{activity.action}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {activity.target}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="mt-4">
              <Button onClick={handleLogActivity} variant="outline" className="w-full">
                <Activity className="h-4 w-4 mr-2" />
                Log Activity
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Chat & Mentions */}
        <div className="space-y-6">
          {/* Room Chat */}
          {roomData && (
            <Card>
              <CardHeader>
                <CardTitle>#{selectedRoom}</CardTitle>
                <CardDescription>
                  {roomData.users.size} {roomData.users.size === 1 ? 'member' : 'members'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] mb-4">
                  {roomData.messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No messages yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {roomData.messages.map(msg => (
                        <div key={msg.id} className="p-2 rounded border">
                          <div className="text-xs text-muted-foreground">
                            User {msg.userId}
                          </div>
                          <div className="text-sm">{msg.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mentions */}
          <Card>
            <CardHeader>
              <CardTitle>Mentions</CardTitle>
              <CardDescription>
                {Mentions.getUnreadCount(currentUserId)} unread
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {mentions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No mentions
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mentions.map(mention => (
                      <div
                        key={mention.id}
                        className={`p-3 rounded-lg border ${!mention.read ? 'bg-accent' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="font-medium">{mention.fromUserName}</div>
                          {!mention.read && <Badge variant="default">New</Badge>}
                        </div>
                        <div className="text-sm mt-1">{mention.message}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(mention.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="mt-4 space-y-2">
                <Button onClick={handleCreateMention} variant="outline" className="w-full">
                  <AtSign className="h-4 w-4 mr-2" />
                  Create Mention
                </Button>
                {mentions.length > 0 && (
                  <Button
                    onClick={() => {
                      Mentions.markAllAsRead(currentUserId);
                      refreshData();
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Mark All Read
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TeamCollaborationDashboard;
