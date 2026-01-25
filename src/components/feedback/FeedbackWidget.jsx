import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';

export default function FeedbackWidget({ type, targetId, onFeedbackSubmitted }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [usefulness, setUsefulness] = useState(0);
  const [corrective, setCorrective] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please rate accuracy');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.AIFeedback.create({
        feedback_type: type,
        target_id: targetId,
        accuracy_rating: rating,
        usefulness_rating: usefulness || 0,
        is_helpful: rating >= 4,
        corrective_feedback: corrective || ''
      });

      toast.success('Feedback submitted! This helps improve our AI.');
      setRating(0);
      setUsefulness(0);
      setCorrective('');
      setIsOpen(false);
      onFeedbackSubmitted?.();
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-1 h-8">
          <MessageSquare className="w-3.5 h-3.5" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rate This {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">How accurate was this?</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-colors"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {rating === 0 ? 'Rate accuracy' : `${rating}/5 stars`}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">How useful was this?</label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={usefulness === 1 ? 'default' : 'outline'}
                onClick={() => setUsefulness(usefulness === 1 ? 0 : 1)}
                className="gap-1"
              >
                <ThumbsUp className="w-4 h-4" />
                Yes
              </Button>
              <Button
                size="sm"
                variant={usefulness === -1 ? 'destructive' : 'outline'}
                onClick={() => setUsefulness(usefulness === -1 ? 0 : -1)}
                className="gap-1"
              >
                <ThumbsDown className="w-4 h-4" />
                No
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Suggestions for improvement</label>
            <Textarea
              placeholder="What could we improve? What did you expect instead?"
              value={corrective}
              onChange={(e) => setCorrective(e.target.value)}
              className="text-sm"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}