import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplateReviews({ templateId }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ rating: 5, title: '', review_text: '' });
  const queryClient = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ['templateReviews', templateId],
    queryFn: () => base44.entities.TemplateReview.filter({ template_id: templateId }, '-created_date')
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return await base44.entities.TemplateReview.create({
        ...data,
        template_id: templateId,
        reviewer_email: user.email,
        reviewer_name: user.full_name,
        verified_purchase: false
      });
    },
    onSuccess: async () => {
      // Update template rating
      const template = await base44.entities.BotTemplate.get(templateId);
      const allReviews = await base44.entities.TemplateReview.filter({ template_id: templateId });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      await base44.entities.BotTemplate.update(templateId, {
        rating: avgRating,
        review_count: allReviews.length
      });

      queryClient.invalidateQueries(['templateReviews', templateId]);
      queryClient.invalidateQueries(['botTemplates']);
      setShowForm(false);
      setFormData({ rating: 5, title: '', review_text: '' });
      toast.success('Review submitted!');
    }
  });

  const markHelpfulMutation = useMutation({
    mutationFn: async (reviewId) => {
      const review = await base44.entities.TemplateReview.get(reviewId);
      return await base44.entities.TemplateReview.update(reviewId, {
        helpful_count: (review.helpful_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['templateReviews', templateId]);
    }
  });

  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100 : 0
  }));

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews & Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{avgRating.toFixed(1)}</div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${star <= avgRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-500">{reviews.length} reviews</div>
            </div>

            <div className="space-y-2">
              {ratingDistribution.map(({ stars, count, percentage }) => (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-sm w-12">{stars} star</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {!showForm && (
            <Button className="w-full mt-4" onClick={() => setShowForm(true)}>
              Write a Review
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Review Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Write Your Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-8 h-8 cursor-pointer ${star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    onClick={() => setFormData({ ...formData, rating: star })}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Review Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Summarize your experience"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Review</label>
              <Textarea
                value={formData.review_text}
                onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                placeholder="Share your thoughts about this template..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => createReviewMutation.mutate(formData)}
                disabled={!formData.review_text || createReviewMutation.isPending}
                className="flex-1"
              >
                Submit Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map(review => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold">{review.reviewer_name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    {review.verified_purchase && (
                      <Badge variant="secondary" className="text-xs">Verified Purchase</Badge>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.created_date).toLocaleDateString()}
                </span>
              </div>

              {review.title && (
                <h4 className="font-semibold mb-2">{review.title}</h4>
              )}
              
              <p className="text-gray-700 mb-3">{review.review_text}</p>

              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markHelpfulMutation.mutate(review.id)}
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Helpful ({review.helpful_count || 0})
                </Button>
              </div>

              {review.response_from_author && (
                <div className="mt-4 pl-4 border-l-2 border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">Author Response</span>
                  </div>
                  <p className="text-sm text-gray-600">{review.response_from_author}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}