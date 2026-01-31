import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import HelpTooltip from '@/components/help/HelpTooltip';
import { Search, Shield, Trash2, Edit2, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([
    {
      id: '1',
      name: 'Fernando Garza',
      email: 'fernando@appforge.dev',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-28 14:32',
      createdAt: '2024-01-01',
      teams: 3,
      projects: 12
    },
    {
      id: '2',
      name: 'John Developer',
      email: 'john@example.com',
      role: 'user',
      status: 'active',
      lastLogin: '2024-01-27 10:15',
      createdAt: '2024-01-10',
      teams: 1,
      projects: 5
    },
    {
      id: '3',
      name: 'Jane Designer',
      email: 'jane@example.com',
      role: 'user',
      status: 'inactive',
      lastLogin: '2024-01-15 09:45',
      createdAt: '2024-01-05',
      teams: 2,
      projects: 8
    },
    {
      id: '4',
      name: 'Admin User',
      email: 'admin@appforge.dev',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-28 11:20',
      createdAt: '2023-12-15',
      teams: 5,
      projects: 20
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [_editingId, _setEditingId] = useState(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRoleChange = (id, newRole) => {
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  const handleStatusChange = (id, newStatus) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
  };

  const handleDeleteUser = (id) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const _getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'inactive':
        return <Clock className="w-4 h-4" />;
      case 'suspended':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    admins: users.filter(u => u.role === 'admin').length,
    inactiveUsers: users.filter(u => u.status === 'inactive').length
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
              <p className="text-sm text-gray-600 mt-2">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.activeUsers}</div>
              <p className="text-sm text-gray-600 mt-2">Active Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.admins}</div>
              <p className="text-sm text-gray-600 mt-2">Admin Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">{stats.inactiveUsers}</div>
              <p className="text-sm text-gray-600 mt-2">Inactive Users</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user accounts and permissions</CardDescription>
            </div>
            <HelpTooltip 
              content="Manage user accounts, change roles, and control user access to the platform."
              title="User Management"
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="user">User</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-sm font-semibold text-gray-900 py-3 px-4">User</th>
                  <th className="text-left text-sm font-semibold text-gray-900 py-3 px-4">Role</th>
                  <th className="text-left text-sm font-semibold text-gray-900 py-3 px-4">Status</th>
                  <th className="text-left text-sm font-semibold text-gray-900 py-3 px-4">Last Login</th>
                  <th className="text-left text-sm font-semibold text-gray-900 py-3 px-4">Teams</th>
                  <th className="text-left text-sm font-semibold text-gray-900 py-3 px-4">Projects</th>
                  <th className="text-left text-sm font-semibold text-gray-900 py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getRoleColor(user.role)}`}
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.status}
                        onChange={(e) => handleStatusChange(user.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer flex items-center gap-2 ${getStatusColor(user.status)}`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-600">{user.lastLogin}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-600 font-medium">{user.teams}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-600 font-medium">{user.projects}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-2"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No users found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Role Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Admin</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Manage all users</li>
                <li>✓ Configure settings</li>
                <li>✓ View audit logs</li>
                <li>✓ Manage API keys</li>
                <li>✓ Access analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Moderator</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ View users</li>
                <li>✓ Manage teams</li>
                <li>✓ View analytics</li>
                <li>✗ Configure settings</li>
                <li>✗ Manage API keys</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">User</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Manage own profile</li>
                <li>✓ Create projects</li>
                <li>✓ Collaborate on teams</li>
                <li>✗ Manage users</li>
                <li>✗ View analytics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
