import React, { useState } from 'react';
import { useOrganizationManager } from './useOrganizationManager';

/**
 * Organization Dashboard Component
 * Manage organization settings and members
 */
export const OrganizationDashboard = () => {
  const {
    organizations,
    currentOrg,
    members,
    setCurrentOrg,
    createOrganization,
    addMember,
    removeMember,
  } = useOrganizationManager();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    try {
      await createOrganization({ name: newOrgName, plan: 'Pro' });
      setNewOrgName('');
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create organization:', err);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await addMember(newMemberEmail, 'member');
      setNewMemberEmail('');
    } catch (err) {
      console.error('Failed to add member:', err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Organization
        </button>
      </div>

      {/* Create Organization Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Create New Organization</h2>
          <form onSubmit={handleCreateOrg} className="space-y-4">
            <input
              type="text"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Organization Name"
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Organizations List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Your Organizations</h2>
        <div className="space-y-3">
          {organizations.map(org => (
            <div
              key={org.id}
              className={`p-4 border rounded-lg cursor-pointer transition ${
                currentOrg?.id === org.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => setCurrentOrg(org)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{org.name}</h3>
                  <p className="text-sm text-gray-600">{org.memberCount} members • {org.plan} plan</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {org.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Members Management */}
      {currentOrg && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Members - {currentOrg.name}</h2>
          
          <form onSubmit={handleAddMember} className="mb-4 flex gap-2">
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 px-4 py-2 border rounded-lg"
              required
            />
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Add Member
            </button>
          </form>

          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{member.email}</p>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
                <button
                  onClick={() => removeMember(member.id)}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
