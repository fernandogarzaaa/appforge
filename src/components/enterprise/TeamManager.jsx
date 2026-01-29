import React, { useState, useEffect } from 'react';
import * as teams from '@/utils/teamCollaboration';

const ROLE_COLORS = {
  owner: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  admin: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
  editor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  viewer: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'
};

export default function TeamManager() {
  const [allTeams, setAllTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [formData, setFormData] = useState({
    teamName: '',
    teamDescription: '',
    inviteEmail: '',
    inviteRole: 'editor'
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Subscribe to team events
    const unsubscribe = teams.onTeamEvent('*', (_event) => {
      loadTeams();
    });

    loadTeams();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMembers(selectedTeam.id);
    }
  }, [selectedTeam]);

  const loadTeams = () => {
    // In a real app, fetch from API
    // For now, get from localStorage
    const stored = localStorage.getItem('teams');
    setAllTeams(stored ? JSON.parse(stored) : []);
  };

  const loadTeamMembers = (teamId) => {
    const members = teams.getTeamMembers(teamId);
    setTeamMembers(members);
  };

  const handleCreateTeam = (e) => {
    e.preventDefault();
    if (!formData.teamName) {
      setMessage('Team name is required');
      return;
    }

    const newTeam = teams.createTeam(formData.teamName, formData.teamDescription);
    setAllTeams(prev => [...prev, newTeam]);
    setMessage(`✅ Team "${formData.teamName}" created!`);
    setFormData({ ...formData, teamName: '', teamDescription: '' });
    setShowCreateTeam(false);

    setTimeout(() => setMessage(''), 3000);
  };

  const handleInviteMember = (e) => {
    e.preventDefault();
    if (!selectedTeam || !formData.inviteEmail) {
      setMessage('Please select a team and enter an email');
      return;
    }

    const _invitation = teams.inviteTeamMember(
      selectedTeam.id,
      formData.inviteEmail,
      formData.inviteRole
    );

    setMessage(
      `✅ Invitation sent to ${formData.inviteEmail}! (Expires in 7 days)`
    );
    setFormData({ ...formData, inviteEmail: '' });
    setShowInvite(false);

    setTimeout(() => setMessage(''), 3000);
  };

  const _handleAcceptInvitation = (teamId, inviteId) => {
    teams.acceptTeamInvitation(teamId, inviteId);
    setMessage('✅ Invitation accepted!');
    loadTeamMembers(teamId);

    setTimeout(() => setMessage(''), 3000);
  };

  const handleUpdateRole = (teamId, memberId, newRole) => {
    teams.updateMemberRole(teamId, memberId, newRole);
    setMessage(`✅ Member role updated to ${newRole}`);
    loadTeamMembers(teamId);

    setTimeout(() => setMessage(''), 3000);
  };

  const handleRemoveMember = (teamId, memberId) => {
    teams.removeTeamMember(teamId, memberId);
    setMessage('✅ Member removed from team');
    loadTeamMembers(teamId);

    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        👥 Team Manager
      </h2>

      {message && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Teams List */}
        <div className="md:col-span-1">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Teams
          </h3>

          <button
            onClick={() => setShowCreateTeam(!showCreateTeam)}
            className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + New Team
          </button>

          {showCreateTeam && (
            <form onSubmit={handleCreateTeam} className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <input
                type="text"
                placeholder="Team name"
                value={formData.teamName}
                onChange={e => setFormData({ ...formData, teamName: e.target.value })}
                className="w-full mb-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Description"
                value={formData.teamDescription}
                onChange={e => setFormData({ ...formData, teamDescription: e.target.value })}
                className="w-full mb-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Create Team
              </button>
            </form>
          )}

          <div className="space-y-2">
            {allTeams.map(team => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className={`w-full text-left p-3 rounded-lg transition ${
                  selectedTeam?.id === team.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-600'
                    : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <p className="font-semibold text-gray-900 dark:text-white">
                  {team.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {team.members?.length || 0} members
                </p>
              </button>
            ))}
          </div>

          {allTeams.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No teams yet
            </p>
          )}
        </div>

        {/* Team Details */}
        <div className="md:col-span-2">
          {selectedTeam ? (
            <div>
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedTeam.name}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {selectedTeam.description}
                </p>
                <button
                  onClick={() => setShowInvite(!showInvite)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + Invite Member
                </button>

                {showInvite && (
                  <form onSubmit={handleInviteMember} className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={formData.inviteEmail}
                      onChange={e => setFormData({ ...formData, inviteEmail: e.target.value })}
                      className="w-full mb-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                    />
                    <select
                      value={formData.inviteRole}
                      onChange={e => setFormData({ ...formData, inviteRole: e.target.value })}
                      className="w-full mb-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Send Invitation
                    </button>
                  </form>
                )}
              </div>

              <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Members ({teamMembers.length})
              </h4>

              <div className="space-y-2">
                {teamMembers.map(member => (
                  <div
                    key={member.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.name || member.email}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {member.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${ROLE_COLORS[member.role] || ROLE_COLORS.viewer}`}>
                        {member.role}
                      </span>
                      {member.role !== 'owner' && (
                        <>
                          <select
                            value={member.role}
                            onChange={e => handleUpdateRole(selectedTeam.id, member.id, e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(selectedTeam.id, member.id)}
                            className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {teamMembers.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No members yet
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">
              Select a team to view members
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
