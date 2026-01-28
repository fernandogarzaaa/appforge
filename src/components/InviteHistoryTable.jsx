import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getInviteStatusColor, getRoleColor, INVITE_STATUS, isInviteExpired } from '@/lib/teamInvites';
import { Mail, RotateCcw, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const InviteHistoryTable = ({
  invites,
  isLoading,
  onResend,
  onCancel
}) => {
  const [cancelConfirm, setCancelConfirm] = useState(null);

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

  if (invites.length === 0) {
    return (
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-4xl mb-4">📬</p>
              <h3 className="text-lg font-semibold dark:text-white mb-1">No Invites Sent</h3>
              <p className="text-gray-500 dark:text-gray-400">Send invitations to add team members</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {invites.map((invite, index) => {
          const isExpired = invite.status === INVITE_STATUS.PENDING && isInviteExpired(invite.expires_at);

          return (
            <motion.div
              key={invite.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 border-b border-gray-200 dark:border-gray-800 last:border-b-0 ${
                index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-950/50'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Email & Details */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium dark:text-white truncate">{invite.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Invited {new Date(invite.created_at).toLocaleDateString()} by {invite.invited_by}
                    </p>
                    {invite.message && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">"{invite.message}"</p>
                    )}
                  </div>
                </div>

                {/* Role */}
                <Badge className={`capitalize flex-shrink-0 ${getRoleColor(invite.role)}`}>
                  {invite.role}
                </Badge>

                {/* Status */}
                <Badge
                  className={`capitalize flex-shrink-0 ${getInviteStatusColor(isExpired ? INVITE_STATUS.EXPIRED : invite.status)}`}
                >
                  {isExpired ? 'Expired' : invite.status}
                </Badge>

                {/* Expiry Warning */}
                {invite.status === INVITE_STATUS.PENDING && !isExpired && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    Expires {new Date(invite.expires_at).toLocaleDateString()}
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {invite.status === INVITE_STATUS.PENDING && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onResend(invite.id);
                        toast.success('Invite resent');
                      }}
                      title="Resend invitation"
                      className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  )}

                  {invite.status === INVITE_STATUS.PENDING && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCancelConfirm(invite)}
                      title="Cancel invitation"
                      className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Cancel Confirmation Dialog */}
      {cancelConfirm && (
        <AlertDialog open={!!cancelConfirm} onOpenChange={() => setCancelConfirm(null)}>
          <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="dark:text-white">Cancel Invitation?</AlertDialogTitle>
              <AlertDialogDescription className="dark:text-gray-400">
                Are you sure you want to cancel the invitation to{' '}
                <span className="font-semibold">{cancelConfirm.email}</span>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                Keep Invite
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onCancel(cancelConfirm.id);
                  setCancelConfirm(null);
                  toast.success('Invitation cancelled');
                }}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
              >
                Cancel Invite
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default InviteHistoryTable;
