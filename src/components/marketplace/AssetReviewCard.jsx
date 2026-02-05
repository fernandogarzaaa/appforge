import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send } from 'lucide-react';

export default function AssetReviewCard({ assetId, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitReview = async () => {
    if (!content) {
      alert('Please write a review');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await base44.functions.invoke('submitAssetReview', {
        assetId,
        rating,
        title: title || `${rating}-star review`,
        content,
      });

      if (response.data?.success) {
        setSubmitted(true);
        setRating(5);
        setTitle('');
        setContent('');
        onReviewSubmitted?.(response.data);
        setTimeout(() => setSubmitted(false), 3000);
      }
    } catch (error) {
      console.error('Review error:', error);
      alert('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4 text-center">
          <p className="text-green-700 font-semibold text-sm">✓ Review submitted! Thank you for contributing to the community.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Share Your Experience</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs font-semibold block mb-2">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                onClick={() => setRating(r)}
                className="transition-transform"
              >
                <Star
                  className={`w-5 h-5 ${
                    r <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Review Title (optional)</label>
          <input
            type="text"
            placeholder="e.g., Amazing time saver!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border rounded-lg"
          />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Your Review</label>
          <Textarea
            placeholder="Share your thoughts about this asset..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-20"
          />
        </div>

        <Button
          onClick={submitReview}
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
        >
          <Send className="w-3 h-3 mr-1" />
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </CardContent>
    </Card>
  );
}