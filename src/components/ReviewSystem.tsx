
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, Review } from '../lib/api';
import { getImageUrl } from '../lib/utils';
import { Star, Camera, Video, Upload, X, Play, Pause, ThumbsUp } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ReviewSystemProps {
  productId: string;
  productName: string;
}

interface ReviewFormData {
  rating: number;
  comment: string;
  images: File[];
  videos: File[];
}

const ReviewSystem: React.FC<ReviewSystemProps> = ({ productId, productName }) => {
  const { user, isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 0,
    comment: '',
    images: [],
    videos: []
  });
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reviews
  const { data: reviews = [], isLoading, refetch } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: () => apiService.getProductReviews(productId),
    enabled: !!productId,
  });

  // Add review mutation
  const addReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      return apiService.addProductReview(productId, data);
    },
    onSuccess: async (newReview) => {
      // Upload media if any
      if (formData.images.length > 0 || formData.videos.length > 0) {
        setUploadingMedia(true);
        try {
          if (formData.images.length > 0) {
            await apiService.uploadReviewMedia(newReview.id || newReview._id!, formData.images, 'image');
          }
          if (formData.videos.length > 0) {
            await apiService.uploadReviewMedia(newReview.id || newReview._id!, formData.videos, 'video');
          }
        } catch (error) {
          console.error('Error uploading media:', error);
          toast({
            title: "Media upload failed",
            description: "Review saved but media upload failed. You can add media later.",
            variant: "destructive",
          });
        } finally {
          setUploadingMedia(false);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      setShowForm(false);
      setFormData({ rating: 0, comment: '', images: [], videos: [] });
      toast({
        title: "Review submitted successfully!",
        description: "Thank you for your feedback.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit review",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleCommentChange = (comment: string) => {
    setFormData(prev => ({ ...prev, comment }));
  };

  const handleFileSelect = (files: FileList | null, type: 'image' | 'video') => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const maxFiles = 5;
    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // 5MB for images, 50MB for videos
    
    const validFiles = fileArray.filter(file => {
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} is too large. Maximum size is ${type === 'image' ? '5MB' : '50MB'}.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} ${type}s allowed.`,
        variant: "destructive",
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      [type === 'image' ? 'images' : 'videos']: [...prev[type === 'image' ? 'images' : 'videos'], ...validFiles]
    }));
  };

  const removeFile = (index: number, type: 'image' | 'video') => {
    setFormData(prev => ({
      ...prev,
      [type === 'image' ? 'images' : 'videos']: prev[type === 'image' ? 'images' : 'videos'].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    addReviewMutation.mutate({
      rating: formData.rating,
      comment: formData.comment
    });
  };

  const handleVideoPlay = (videoUrl: string) => {
    setPlayingVideo(playingVideo === videoUrl ? null : videoUrl);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(review => review.rating === rating).length / reviews.length) * 100 : 0
  }));

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Customer Reviews</span>
            <Badge variant="secondary">{reviews.length} reviews</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">{averageRating.toFixed(1)}</div>
              <div className="flex justify-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} fill={star <= averageRating ? "#facc15" : "none"} className={`w-5 h-5 ${star <= averageRating ? 'text-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <p className="text-sm text-gray-600">Based on {reviews.length} reviews</p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-8">{rating}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      {!isAuthenticated ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-gray-600">Please log in to write a review.</CardContent>
        </Card>
      ) : !showForm ? (
        <Button 
          onClick={() => setShowForm(true)}
          className="w-full md:w-auto"
        >
          Write a Review
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Write a Review for {productName}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">Rating *</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      {star <= formData.rating ? (
                        <Star fill="#facc15" className="w-6 h-6 text-yellow-400" />
                      ) : (
                        <Star className="w-6 h-6 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium mb-2">Review</label>
                <Textarea
                  value={formData.comment}
                  onChange={(e) => handleCommentChange(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.comment.length}/1000 characters
                </p>
              </div>

              {/* Media Upload */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Add Photos/Videos</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Add Photos
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => videoInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      Add Videos
                    </Button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files, 'image')}
                    className="hidden"
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files, 'video')}
                    className="hidden"
                  />
                </div>

                {/* Preview Images */}
                {formData.images.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Images ({formData.images.length}/5)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {formData.images.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(index, 'image')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Videos */}
                {formData.videos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Videos ({formData.videos.length}/5)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {formData.videos.map((file, index) => (
                        <div key={index} className="relative">
                          <video
                            src={URL.createObjectURL(file)}
                            className="w-full h-20 object-cover rounded-md"
                            muted
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(index, 'video')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={addReviewMutation.isPending || uploadingMedia}
                  className="flex-1"
                >
                  {addReviewMutation.isPending || uploadingMedia ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      {uploadingMedia ? 'Uploading Media...' : 'Submitting...'}
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ rating: 0, comment: '', images: [], videos: [] });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No reviews yet. Be the first to review this product!
          </div>
        ) : (
          reviews
            .slice()
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((review) => (
            <Card key={review.id || review._id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={getImageUrl(review.user.avatar)} />
                    <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.user.name}</span>
                      {review.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified Purchase
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} fill={star <= review.rating ? "#facc15" : "none"} className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    
                    {review.comment && (
                      <p className="text-gray-700">{review.comment}</p>
                    )}

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                        {review.images.map((image, index) => (
                          <img
                            key={index}
                            src={getImageUrl(image.url)}
                            alt={image.alt || `Review image ${index + 1}`}
                            className="w-full h-20 object-cover rounded-md cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedReview(review)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Review Videos */}
                    {review.videos && review.videos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                        {review.videos.map((video, index) => (
                          <div key={index} className="relative">
                            <video
                              src={getImageUrl(video.url)}
                              className="w-full h-20 object-cover rounded-md cursor-pointer"
                              onClick={() => handleVideoPlay(video.url)}
                              muted={playingVideo !== video.url}
                            />
                            <button
                              onClick={() => handleVideoPlay(video.url)}
                              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 rounded-md"
                            >
                              {playingVideo === video.url ? (
                                <Pause className="w-6 h-6 text-white" />
                              ) : (
                                <Play className="w-6 h-6 text-white" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm"
                        onClick={async () => {
                          try {
                            await apiService.toggleReviewHelpful((review as any)._id || (review as any).id);
                            queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
                          } catch (err) {
                            toast({ title: 'Failed to update helpful vote', variant: 'destructive' });
                          }
                        }}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" /> Helpful ({review.helpful?.count || 0})
                      </Button>

                      {/* Edit/Delete for owner */}
                      {isAuthenticated && ((review as any).user?._id === (user as any)?._id || (review as any).user?.id === (user as any)?.id) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const newComment = prompt('Update your review comment', review.comment || '');
                              if (newComment === null) return;
                              try {
                                await apiService.updateReview((review as any)._id || (review as any).id, { comment: newComment });
                                queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
                              } catch (err) {
                                toast({ title: 'Failed to update review', variant: 'destructive' });
                              }
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              if (!confirm('Delete this review?')) return;
                              try {
                                await apiService.deleteReview((review as any)._id || (review as any).id);
                                queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
                              } catch (err) {
                                toast({ title: 'Failed to delete review', variant: 'destructive' });
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Image Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Review Images</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReview(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selectedReview.images?.map((image, index) => (
                <img
                  key={index}
                  src={getImageUrl(image.url)}
                  alt={image.alt || `Review image ${index + 1}`}
                  className="w-full h-48 object-cover rounded-md"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSystem;
