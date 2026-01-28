import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getRoleColor, TEAM_ROLES } from '@/lib/teamInvites';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const TeamMembersList = ({
  members,
  isLoading,
  onRemove,
  onUpdateRole
}) => {
  const [removeConfirm, setRemoveConfirm] = useState(null);

  if (isLoading) {
    return (
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-blue-500 rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-4xl mb-4">👥</p>
              <h3 className="text-lg font-semibold dark:text-white mb-1">No Team Members</h3>
              <p className="text-gray-500 dark:text-gray-400">Invite team members to get started</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {members.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 border-b border-gray-200 dark:border-gray-800 last:border-b-0 ${
              index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-950/50'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Avatar & Info */}
              <div className="flex-1 min-w-0 flex items-center gap-3">
                {member.avatar && (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-medium dark:text-white truncate">{member.name || member.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.email}</p>
                  {member.last_active && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Last active: {new Date(member.last_active).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Role Selector */}
              <div className="flex items-center gap-2">
                <Select value={member.role} onValueChange={(newRole) => {
                  onUpdateRole(member.id, newRole);
                  toast.success(`Role updated to ${newRole}`);
                }}>
                  <SelectTrigger className={`w-32 text-xs font-medium capitalize dark:bg-gray-800 dark:border-gray-700 ${getRoleColor(member.role)}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {Object.values(TEAM_ROLES).map((role) => (
                      <SelectItem key={role} value={role} className="capitalize">
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Remove Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRemoveConfirm(member)}
                title="Remove member"
                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Remove Confirmation Dialog */}
      {removeConfirm && (
        <AlertDialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
          <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="dark:text-white">Remove Team Member?</AlertDialogTitle>
              <AlertDialogDescription className="dark:text-gray-400">
                Are you sure you want to remove <span className="font-semibold">{removeConfirm.name || removeConfirm.email}</span> from the team? 
                They will lose access to all projects.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onRemove(removeConfirm.id);
                  setRemoveConfirm(null);
                  toast.success('Member removed');
                }}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
              >
                Remove
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default TeamMembersList;
