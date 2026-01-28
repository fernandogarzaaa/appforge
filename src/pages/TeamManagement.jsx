import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTeamInvites } from '@/hooks/useTeamInvites';
import { InviteTeamMemberForm } from '@/components/InviteTeamMemberForm';
import { TeamMembersList } from '@/components/TeamMembersList';
import { InviteHistoryTable } from '@/components/InviteHistoryTable';
import { INVITE_STATUS } from '@/lib/teamInvites';
import { Users, UserPlus, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeamManagement({ projectId = 'proj_default' }) {
  const {
    members,
    invites,
    isLoading,
    inviteMember,
    resendInvite,
    cancelInvite,
    removeMember,
    updateMemberRole,
    getPendingInvites
  } = useTeamInvites(projectId);

  const [inviteFormOpen, setInviteFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('members'); // members, invites

  const pendingInvites = getPendingInvites();
  const acceptedInvites = invites.filter(i => i.status === INVITE_STATUS.ACCEPTED);

  const handleInviteSubmit = async (email, role, message) => {
    try {
      inviteMember(email, role, message);
      toast.success(`Invitation sent to ${email}`);
    } catch (err) {
      toast.error('Failed to send invitation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white mb-1">Team Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your team members and invitations</p>
        </div>
        <Button
          onClick={() => setInviteFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Team Members */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Team Members</p>
                <p className="text-3xl font-bold dark:text-white">{members.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pending Invites</p>
                <p className="text-3xl font-bold dark:text-white">{pendingInvites.length}</p>
              </div>
              <Mail className="w-10 h-10 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* All Invitations */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Invitations (All)</p>
                <p className="text-3xl font-bold dark:text-white">{invites.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            Team Members ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'invites'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            Invitations ({invites.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'members' && (
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Active Team Members</CardTitle>
            <CardDescription className="dark:text-gray-400">
              People with access to this project
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <TeamMembersList
              members={members}
              isLoading={isLoading}
              onRemove={removeMember}
              onUpdateRole={updateMemberRole}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'invites' && (
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Invitation History</CardTitle>
            <CardDescription className="dark:text-gray-400">
              View and manage sent invitations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <InviteHistoryTable
              invites={invites}
              isLoading={isLoading}
              onResend={resendInvite}
              onCancel={cancelInvite}
            />
          </CardContent>
        </Card>
      )}

      {/* Guidelines */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-300">Team Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p>• <strong>Admin:</strong> Full access to all settings, deployments, and team management</p>
          <p>• <strong>Developer:</strong> Can deploy to staging/production and edit projects</p>
          <p>• <strong>Viewer:</strong> Read-only access to view projects and deployments</p>
          <p>• Invitations expire after 7 days if not accepted</p>
          <p>• You can resend or cancel pending invitations anytime</p>
        </CardContent>
      </Card>

      {/* Invite Form Modal */}
      <InviteTeamMemberForm
        open={inviteFormOpen}
        onClose={() => setInviteFormOpen(false)}
        onSubmit={handleInviteSubmit}
        isLoading={false}
      />
    </div>
  );
}

export default TeamManagement;
