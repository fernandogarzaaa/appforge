import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Shield, Search, UserPlus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUserManagement() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      if (userData?.role === 'admin') {
        const allUsers = await base44.asServiceRole.entities.User.list('-created_date');
        setUsers(allUsers);
      }
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (error) {
      toast.error('Failed to send invitation: ' + error.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  if (user?.role !== 'admin') {
    return (
      <Card className="border-red-200 m-6">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-semibold">Admin Access Required</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage users and permissions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="text-xs text-gray-600">Total Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div className="text-xs text-gray-600">Admins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.role === 'user').length}
              </div>
              <div className="text-xs text-gray-600">Regular Users</div>
            </CardContent>
          </Card>
        </div>

        {/* Invite User */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              Invite New User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <Button onClick={handleInvite} className="bg-green-600">
                <Mail className="w-4 h-4 mr-2" />
                Send Invite
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Users</CardTitle>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredUsers.map(u => (
                <div key={u.id} className="p-4 bg-gray-50 rounded-lg border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {u.full_name?.charAt(0) || u.email?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{u.full_name || 'Unnamed'}</div>
                      <div className="text-sm text-gray-600">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={u.role === 'admin' ? 'default' : 'outline'}>
                      {u.role === 'admin' ? (
                        <><Shield className="w-3 h-3 mr-1" /> Admin</>
                      ) : (
                        <><Users className="w-3 h-3 mr-1" /> User</>
                      )}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      Joined {new Date(u.created_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}