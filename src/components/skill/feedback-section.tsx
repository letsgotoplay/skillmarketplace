'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star, MessageSquare, Send, ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';

interface Feedback {
  id: string;
  rating: number | null;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface SkillFeedbackProps {
  skillId: string;
}

export function SkillFeedbackSection({ skillId }: SkillFeedbackProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [skillId]);

  const fetchFeedback = async () => {
    try {
      const response = await fetch(`/api/skills/${skillId}/feedback`);
      if (response.ok) {
        const data = await response.json();
        setFeedback(data);
      }
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!rating && !comment.trim()) {
      setError('Please provide a rating or comment');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/skills/${skillId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: rating || null, comment: comment.trim() || null }),
        credentials: 'include',
      });

      if (response.ok) {
        const newFeedback = await response.json();
        setFeedback([newFeedback, ...feedback]);
        setRating(0);
        setComment('');
        setSuccess(true);
        setShowForm(false);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      setError('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = feedback.length > 0 && feedback.some(f => f.rating)
    ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.filter(f => f.rating).length).toFixed(1)
    : null;

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: feedback.filter(f => f.rating === star).length,
    percentage: feedback.some(f => f.rating) ? (feedback.filter(f => f.rating === star).length / feedback.filter(f => f.rating).length) * 100 : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Feedback Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Reviews & Feedback
              </CardTitle>
              <CardDescription className="mt-1">
                {feedback.length} review{feedback.length !== 1 ? 's' : ''}
                {averageRating && ` · ${averageRating} average rating`}
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              variant={showForm ? 'outline' : 'default'}
              size="sm"
            >
              {showForm ? 'Cancel' : 'Write a Review'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Rating Summary */}
          {feedback.length > 0 && (
            <div className="flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b">
              {/* Average Rating Display */}
              <div className="text-center md:text-left">
                <div className="text-5xl font-bold">
                  {averageRating || '-'}
                </div>
                <div className="flex gap-0.5 justify-center md:justify-start mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(Number(averageRating) || 0)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on {feedback.filter(f => f.rating).length} rating{feedback.filter(f => f.rating).length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="flex-1">
                {ratingDistribution.map(({ star, count, percentage }) => (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-3">{star}</span>
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-muted-foreground text-xs">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 pb-6 border-b">
              {/* Star Rating */}
              <div>
                <label className="text-sm font-medium mb-2 block">Your Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground self-center">
                    {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select rating'}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="text-sm font-medium mb-2 block">Your Review (optional)</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this skill. What worked well? What could be improved?"
                  rows={4}
                />
              </div>

              {/* Error/Success Messages */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
              )}
              {success && (
                <p className="text-sm text-green-600 bg-green-50 p-2 rounded">Thank you for your feedback!</p>
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={submitting}>
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          )}

          {/* Feedback List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : feedback.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No reviews yet</p>
              <p className="text-sm mt-1">Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border ${index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium shrink-0">
                      {(item.user.name || item.user.email)[0].toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center flex-wrap gap-2">
                        <p className="font-medium">{item.user.name || item.user.email.split('@')[0]}</p>
                        {item.rating && (
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= item.rating!
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Comment */}
                      {item.comment && (
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                          {item.comment}
                        </p>
                      )}

                      {/* Helpful Button */}
                      <div className="mt-3 flex items-center gap-4">
                        <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                          <ThumbsUp className="h-3 w-3" />
                          Helpful
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {feedback.length >= 10 && (
                <Button variant="outline" className="w-full">
                  Load More Reviews
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
