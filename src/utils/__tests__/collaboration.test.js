import { describe, it, expect, beforeEach } from 'vitest';
import {
  UserPresence,
  ActivityFeed,
  Mentions,
  CollaborativeRoom,
  clearCollaborationData
} from '../collaboration';

describe('Collaboration System', () => {
  beforeEach(() => {
    clearCollaborationData();
  });

  describe('UserPresence', () => {
    it('should set user online', () => {
      const presence = UserPresence.setOnline('user1', {
        name: 'Test User',
        currentPage: '/dashboard'
      });

      expect(presence.userId).toBe('user1');
      expect(presence.status).toBe('online');
      expect(presence.name).toBe('Test User');
    });

    it('should set user away', () => {
      UserPresence.setOnline('user1', { name: 'Test' });
      UserPresence.setAway('user1');

      const users = UserPresence.getOnlineUsers();
      const user = users.find(u => u.userId === 'user1');
      expect(user).toBeUndefined();
    });

    it('should set user offline', () => {
      UserPresence.setOnline('user1', { name: 'Test' });
      UserPresence.setOffline('user1');

      const onlineUsers = UserPresence.getOnlineUsers();
      expect(onlineUsers.length).toBe(0);
    });

    it('should get online users', () => {
      UserPresence.setOnline('user1', { name: 'User 1' });
      UserPresence.setOnline('user2', { name: 'User 2' });

      const online = UserPresence.getOnlineUsers();
      expect(online.length).toBe(2);
    });

    it('should get users in project', () => {
      UserPresence.setOnline('user1', { name: 'User 1', currentProject: 'proj1' });
      UserPresence.setOnline('user2', { name: 'User 2', currentProject: 'proj2' });

      const users = UserPresence.getUsersInProject('proj1');
      expect(users.length).toBe(1);
      expect(users[0].userId).toBe('user1');
    });

    it('should update cursor position', () => {
      UserPresence.updateCursor('user1', { x: 100, y: 200 });

      const cursors = UserPresence.getCursors();
      expect(cursors.length).toBe(1);
      expect(cursors[0].position.x).toBe(100);
    });

    it('should notify subscribers', () => {
      let notified = false;
      const unsubscribe = UserPresence.subscribe(() => {
        notified = true;
      });

      UserPresence.setOnline('user1', { name: 'Test' });
      expect(notified).toBe(true);

      unsubscribe();
    });
  });

  describe('ActivityFeed', () => {
    it('should log activity', () => {
      const activity = ActivityFeed.logActivity({
        userId: 'user1',
        userName: 'Test User',
        type: 'edit',
        action: 'Updated file',
        target: 'test.js'
      });

      expect(activity.id).toBeDefined();
      expect(activity.type).toBe('edit');
    });

    it('should get activities', () => {
      ActivityFeed.logActivity({
        userId: 'user1',
        userName: 'User 1',
        type: 'create',
        action: 'Created project',
        target: 'Project A'
      });

      const activities = ActivityFeed.getActivities();
      expect(activities.length).toBe(1);
    });

    it('should filter activities by user', () => {
      ActivityFeed.logActivity({
        userId: 'user1',
        userName: 'User 1',
        type: 'edit',
        action: 'Edit 1',
        target: 'File 1'
      });
      ActivityFeed.logActivity({
        userId: 'user2',
        userName: 'User 2',
        type: 'edit',
        action: 'Edit 2',
        target: 'File 2'
      });

      const activities = ActivityFeed.getActivities({ userId: 'user1' });
      expect(activities.length).toBe(1);
      expect(activities[0].userId).toBe('user1');
    });

    it('should filter activities by type', () => {
      ActivityFeed.logActivity({
        userId: 'user1',
        userName: 'User 1',
        type: 'create',
        action: 'Created',
        target: 'A'
      });
      ActivityFeed.logActivity({
        userId: 'user1',
        userName: 'User 1',
        type: 'edit',
        action: 'Edited',
        target: 'B'
      });

      const activities = ActivityFeed.getActivities({ type: 'create' });
      expect(activities.length).toBe(1);
      expect(activities[0].type).toBe('create');
    });

    it('should limit activities', () => {
      for (let i = 0; i < 10; i++) {
        ActivityFeed.logActivity({
          userId: 'user1',
          userName: 'User 1',
          type: 'edit',
          action: `Edit ${i}`,
          target: `File ${i}`
        });
      }

      const activities = ActivityFeed.getActivities({ limit: 5 });
      expect(activities.length).toBe(5);
    });

    it('should get activity statistics', () => {
      ActivityFeed.logActivity({
        userId: 'user1',
        userName: 'User 1',
        type: 'create',
        action: 'Created',
        target: 'A'
      });
      ActivityFeed.logActivity({
        userId: 'user1',
        userName: 'User 1',
        type: 'edit',
        action: 'Edited',
        target: 'B'
      });

      const stats = ActivityFeed.getStats();
      expect(stats.total).toBe(2);
      expect(stats.byType.create).toBe(1);
      expect(stats.byType.edit).toBe(1);
    });
  });

  describe('Mentions', () => {
    it('should create mention', () => {
      const mention = Mentions.create({
        fromUserId: 'user1',
        fromUserName: 'User 1',
        toUserId: 'user2',
        context: 'comment',
        message: 'Check this out',
        link: '/project/123'
      });

      expect(mention.id).toBeDefined();
      expect(mention.toUserId).toBe('user2');
      expect(mention.read).toBe(false);
    });

    it('should get mentions for user', () => {
      Mentions.create({
        fromUserId: 'user1',
        fromUserName: 'User 1',
        toUserId: 'user2',
        context: 'comment',
        message: 'Test',
        link: '/test'
      });

      const mentions = Mentions.getMentions('user2');
      expect(mentions.length).toBe(1);
    });

    it('should get unread mentions only', () => {
      const mention = Mentions.create({
        fromUserId: 'user1',
        fromUserName: 'User 1',
        toUserId: 'user2',
        context: 'comment',
        message: 'Test',
        link: '/test'
      });

      let unread = Mentions.getMentions('user2', true);
      expect(unread.length).toBe(1);

      Mentions.markAsRead(mention.id);

      unread = Mentions.getMentions('user2', true);
      expect(unread.length).toBe(0);
    });

    it('should mark mention as read', () => {
      const mention = Mentions.create({
        fromUserId: 'user1',
        fromUserName: 'User 1',
        toUserId: 'user2',
        context: 'comment',
        message: 'Test',
        link: '/test'
      });

      Mentions.markAsRead(mention.id);

      const mentions = Mentions.getMentions('user2');
      expect(mentions[0].read).toBe(true);
    });

    it('should mark all mentions as read', () => {
      Mentions.create({
        fromUserId: 'user1',
        fromUserName: 'User 1',
        toUserId: 'user2',
        context: 'comment',
        message: 'Test 1',
        link: '/test1'
      });
      Mentions.create({
        fromUserId: 'user1',
        fromUserName: 'User 1',
        toUserId: 'user2',
        context: 'comment',
        message: 'Test 2',
        link: '/test2'
      });

      Mentions.markAllAsRead('user2');

      const mentions = Mentions.getMentions('user2');
      expect(mentions.every(m => m.read)).toBe(true);
    });

    it('should get unread count', () => {
      Mentions.create({
        fromUserId: 'user1',
        fromUserName: 'User 1',
        toUserId: 'user2',
        context: 'comment',
        message: 'Test 1',
        link: '/test'
      });
      Mentions.create({
        fromUserId: 'user1',
        fromUserName: 'User 1',
        toUserId: 'user2',
        context: 'comment',
        message: 'Test 2',
        link: '/test'
      });

      expect(Mentions.getUnreadCount('user2')).toBe(2);
    });
  });

  describe('CollaborativeRoom', () => {
    it('should join room', () => {
      const room = CollaborativeRoom.join('room1', 'user1', {
        name: 'User 1',
        avatar: '👤'
      });

      expect(room.id).toBe('room1');
      expect(room.users.has('user1')).toBe(true);
    });

    it('should leave room', () => {
      CollaborativeRoom.join('room1', 'user1', { name: 'User 1' });
      CollaborativeRoom.leave('room1', 'user1');

      const room = CollaborativeRoom.getRoom('room1');
      expect(room).toBeUndefined();
    });

    it('should send message to room', () => {
      CollaborativeRoom.join('room1', 'user1', { name: 'User 1' });
      const message = CollaborativeRoom.sendMessage('room1', 'user1', 'Hello');

      expect(message).toBeDefined();
      expect(message.message).toBe('Hello');

      const room = CollaborativeRoom.getRoom('room1');
      expect(room.messages.length).toBe(1);
    });

    it('should limit messages to 100', () => {
      CollaborativeRoom.join('room1', 'user1', { name: 'User 1' });

      for (let i = 0; i < 150; i++) {
        CollaborativeRoom.sendMessage('room1', 'user1', `Message ${i}`);
      }

      const room = CollaborativeRoom.getRoom('room1');
      expect(room.messages.length).toBe(100);
    });

    it('should get all rooms', () => {
      CollaborativeRoom.join('room1', 'user1', { name: 'User 1' });
      CollaborativeRoom.join('room2', 'user2', { name: 'User 2' });

      const rooms = CollaborativeRoom.getAllRooms();
      expect(rooms.length).toBe(2);
    });

    it('should update shared state', () => {
      CollaborativeRoom.join('room1', 'user1', { name: 'User 1' });
      CollaborativeRoom.updateSharedState('room1', 'cursor', { x: 100, y: 200 });

      const state = CollaborativeRoom.getSharedState('room1');
      expect(state.cursor.x).toBe(100);
    });

    it('should delete room when last user leaves', () => {
      CollaborativeRoom.join('room1', 'user1', { name: 'User 1' });
      CollaborativeRoom.join('room1', 'user2', { name: 'User 2' });

      CollaborativeRoom.leave('room1', 'user1');
      expect(CollaborativeRoom.getRoom('room1')).toBeDefined();

      CollaborativeRoom.leave('room1', 'user2');
      expect(CollaborativeRoom.getRoom('room1')).toBeUndefined();
    });
  });

  describe('clearCollaborationData', () => {
    it('should clear all collaboration data', () => {
      UserPresence.setOnline('user1', { name: 'User 1' });
      ActivityFeed.logActivity({
        userId: 'user1',
        userName: 'User 1',
        type: 'edit',
        action: 'Test',
        target: 'Test'
      });
      Mentions.create({
        fromUserId: 'user1',
        fromUserName: 'User 1',
        toUserId: 'user2',
        context: 'comment',
        message: 'Test',
        link: '/test'
      });
      CollaborativeRoom.join('room1', 'user1', { name: 'User 1' });

      clearCollaborationData();

      expect(UserPresence.getOnlineUsers().length).toBe(0);
      expect(ActivityFeed.getActivities().length).toBe(0);
      expect(Mentions.getMentions('user2').length).toBe(0);
      expect(CollaborativeRoom.getAllRooms().length).toBe(0);
    });
  });
});
