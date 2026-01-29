import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivityCard } from '@/components/ActivityCard'
import { Bell, Trash2, CheckCheck } from 'lucide-react'
import { useActivity } from '@/contexts/ActivityContext'
import EmptyState from '@/components/common/EmptyState'

/**
 * ActivityFeed - Displays all activities and notifications
 */
export function ActivityFeed() {
  const { activities, unreadCount, markAsRead, deleteActivity, clearActivities } = useActivity()
  const [filteredActivities, setFilteredActivities] = useState(activities)
  const [filterType, setFilterType] = useState('all') // all, unread, success, error

  // Update filtered activities when activities or filter changes
  useEffect(() => {
    let filtered = activities

    if (filterType === 'unread') {
      filtered = activities.filter(a => !a.read)
    } else if (filterType === 'success') {
      filtered = activities.filter(a => a.severity === 'success')
    } else if (filterType === 'error') {
      filtered = activities.filter(a => a.severity === 'error')
    }

    setFilteredActivities(filtered)
  }, [activities, filterType])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Activity Feed
              </CardTitle>
              <CardDescription>
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsRead()}
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all as read
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={clearActivities}
                disabled={activities.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={filterType} onValueChange={setFilterType} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="relative">
                All
                {activities.length > 0 && (
                  <span className="ml-2 text-xs bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    {activities.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread" className="relative">
                Unread
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="success">Success</TabsTrigger>
              <TabsTrigger value="error">Errors</TabsTrigger>
            </TabsList>

            {/* All Activities Tab */}
            <TabsContent value="all" className="space-y-3 mt-4">
              {filteredActivities.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No activities yet"
                  description="Your activities will appear here as you use the app"
                />
              ) : (
                <div className="space-y-2">
                  {filteredActivities.map(activity => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onDelete={deleteActivity}
                      onRead={(id) => markAsRead([id])}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Unread Activities Tab */}
            <TabsContent value="unread" className="space-y-3 mt-4">
              {filteredActivities.length === 0 ? (
                <EmptyState
                  icon={CheckCheck}
                  title="No unread activities"
                  description="You're all caught up!"
                />
              ) : (
                <div className="space-y-2">
                  {filteredActivities.map(activity => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onDelete={deleteActivity}
                      onRead={(id) => markAsRead([id])}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Success Activities Tab */}
            <TabsContent value="success" className="space-y-3 mt-4">
              {filteredActivities.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No successful activities"
                  description="Success activities will appear here"
                />
              ) : (
                <div className="space-y-2">
                  {filteredActivities.map(activity => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onDelete={deleteActivity}
                      onRead={(id) => markAsRead([id])}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Error Activities Tab */}
            <TabsContent value="error" className="space-y-3 mt-4">
              {filteredActivities.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No errors recorded"
                  description="Error activities will appear here"
                />
              ) : (
                <div className="space-y-2">
                  {filteredActivities.map(activity => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onDelete={deleteActivity}
                      onRead={(id) => markAsRead([id])}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Statistics */}
      {activities.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
              <div>
                <div className="text-lg font-bold text-blue-500">{activities.length}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-500">{unreadCount}</div>
                <div className="text-xs text-muted-foreground">Unread</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-500">
                  {activities.filter(a => a.severity === 'success').length}
                </div>
                <div className="text-xs text-muted-foreground">Success</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-500">
                  {activities.filter(a => a.severity === 'error').length}
                </div>
                <div className="text-xs text-muted-foreground">Errors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ActivityFeed
