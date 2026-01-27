import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, CheckCircle2, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function NodeCommentThread({ botId, nodeId, comments = [] }) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const user = React.useRef(null);

  React.useEffect(() => {
    const getUser = async () => {
      user.current = await base44.auth.me();
    };
    getUser();
  }, []);

  const addCommentMutation = useMutation({
    mutationFn: async (content) => {
      const botComments = await base44.entities.WorkflowNodeComment.filter({ bot_id: botId, node_id: nodeId });
      
      if (botComments.length === 0) {
        await base44.entities.WorkflowNodeComment.create({
          bot_id: botId,
          node_id: nodeId,
          author_email: user.current.email,
          content
        });
      } else {
        const comment = botComments[0];
        await base44.entities.WorkflowNodeComment.update(comment.id, {
          replies: [
            ...(comment.replies || []),
            {
              reply_id: Math.random().toString(36).substr(2, 9),
              author_email: user.current.email,
              content,
              created_at: new Date().toISOString()
            }
          ]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodeComments', botId, nodeId] });
      setNewComment('');
      toast.success('Comment added');
    }
  });

  const resolveCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      await base44.entities.WorkflowNodeComment.update(commentId, {
        resolved: true,
        resolved_by: user.current.email,
        resolved_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodeComments', botId, nodeId] });
      toast.success('Comment resolved');
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      await base44.entities.WorkflowNodeComment.delete(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodeComments', botId, nodeId] });
      toast.success('Comment deleted');
    }
  });

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    await addCommentMutation.mutateAsync(newComment);
    setSubmitting(false);
  };

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white p-3 rounded-lg border border-blue-100">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-gray-900">{comment.author_email}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(comment.created_date).toLocaleDateString()}
                  </p>
                </div>
                {comment.resolved && (
                  <Badge className="bg-green-100 text-green-800 text-xs">Resolved</Badge>
                )}
              </div>
              <p className="text-sm text-gray-700 mb-2">{comment.content}</p>

              {comment.replies?.length > 0 && (
                <div className="ml-4 pl-3 border-l-2 border-blue-200 space-y-2 mt-2">
                  {comment.replies.map((reply) => (
                    <div key={reply.reply_id}>
                      <p className="text-xs font-semibold text-gray-800">{reply.author_email}</p>
                      <p className="text-xs text-gray-600">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-2">
                {!comment.resolved && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7"
                    onClick={() => resolveCommentMutation.mutate(comment.id)}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Resolve
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 text-red-600"
                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmitComment} className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="text-xs"
          />
          <Button
            type="submit"
            disabled={submitting || !newComment.trim()}
            size="sm"
            className="w-full"
          >
            Post Comment
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}