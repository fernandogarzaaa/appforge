import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function NodeCommentSection({ botId, nodeId }) {
  const [newComment, setNewComment] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['nodeComments', botId, nodeId],
    queryFn: () => base44.entities.BotComment.filter({ bot_id: botId, node_id: nodeId }),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const addCommentMutation = useMutation({
    mutationFn: () => base44.entities.BotComment.create({
      bot_id: botId,
      node_id: nodeId,
      content: newComment,
      author_email: currentUser.email,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodeComments', botId, nodeId] });
      setNewComment('');
      toast.success('Comment added');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.BotComment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodeComments', botId, nodeId] });
    },
  });

  const resolveThreadMutation = useMutation({
    mutationFn: (id) => base44.entities.BotComment.update(id, { 
      resolved: true,
      resolved_by: currentUser.email 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodeComments', botId, nodeId] });
    },
  });

  if (!isOpen) {
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="absolute top-2 right-2"
      >
        <MessageCircle className="w-4 h-4" />
        {comments.length > 0 && <span className="ml-1 text-xs">{comments.length}</span>}
      </Button>
    );
  }

  return (
    <div className="absolute right-0 top-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-3 pb-2 border-b">
        <h4 className="text-sm font-semibold">Comments ({comments.length})</h4>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <div className="space-y-3 mb-4">
        {comments.filter(c => !c.reply_to_id).map((comment) => (
          <div key={comment.id} className="bg-gray-50 p-3 rounded text-xs">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{comment.author_email}</p>
                <p className="text-gray-600 mt-1">{comment.content}</p>
                {comment.resolved && <Badge variant="outline" className="mt-2">Resolved</Badge>}
              </div>
              {comment.author_email === currentUser?.email && (
                <button
                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-gray-400 mt-2">{formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}</p>
            {!comment.resolved && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => resolveThreadMutation.mutate(comment.id)}
                className="mt-2 text-xs"
              >
                Mark Resolved
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="border-t pt-3 space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="text-xs"
        />
        <Button
          size="sm"
          onClick={() => addCommentMutation.mutate()}
          disabled={!newComment.trim()}
          className="w-full"
        >
          Comment
        </Button>
      </div>
    </div>
  );
}