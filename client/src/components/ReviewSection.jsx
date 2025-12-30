// client/src/components/ReviewSection.jsx
import React, { useState, useEffect, useContext } from 'react';
import { LoggedInContext } from '../context/LoggedInContext';
import {
    Box, Paper, Typography, Rating, TextField, Button, Avatar,
    Stack, Divider, Alert, CircularProgress, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function ReviewSection({ courseId, isEnrolled }) {
    const { isLogged, userData, showAlert } = useContext(LoggedInContext);
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // User's own review state
    const [userReview, setUserReview] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Review form
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [courseId]);

    const fetchReviews = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}/reviews`);
            const data = await res.json();
            
            // FIXED: Ensure we convert to Number (handles BigInt, null, undefined)
            setAverageRating(Number(data.averageRating) || 0);
            setTotalReviews(Number(data.totalReviews) || 0);
            
            // Separate user's review from others
            if (isLogged && userData?.userId) {
                const myReview = data.reviews.find(r => r.user_id === userData.userId);
                const otherReviews = data.reviews.filter(r => r.user_id !== userData.userId);
                
                setUserReview(myReview || null);
                setReviews(otherReviews);
                
                // Pre-fill form with existing review
                if (myReview && !isEditing) {
                    setUserRating(Number(myReview.rating));
                    setUserComment(myReview.comment || '');
                }
            } else {
                setReviews(data.reviews || []);
            }
            
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!userRating) {
            showAlert("Please select a rating", "warning");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: userRating, comment: userComment })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            showAlert(
                userReview ? "Review updated successfully!" : "Review submitted successfully!", 
                "success"
            );
            setIsEditing(false);
            fetchReviews(); // Refresh to show updated review
        } catch (err) {
            showAlert(err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditReview = () => {
        setIsEditing(true);
        if (userReview) {
            setUserRating(Number(userReview.rating));
            setUserComment(userReview.comment || '');
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        if (userReview) {
            setUserRating(Number(userReview.rating));
            setUserComment(userReview.comment || '');
        } else {
            setUserRating(0);
            setUserComment('');
        }
    };

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    // FIXED: Safely format averageRating
    const formattedRating = typeof averageRating === 'number' 
        ? averageRating.toFixed(1) 
        : '0.0';

    return (
        <Box>
            {/* Reviews Summary */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Typography variant="h4" fontWeight="bold">
                        {formattedRating}
                    </Typography>
                    <Box>
                        <Rating value={averageRating} precision={0.1} readOnly size="large" />
                        <Typography variant="body2" color="text.secondary">
                            Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            {/* User's Own Review (if exists) - Display Mode */}
            {isLogged && isEnrolled && userReview && !isEditing && (
                <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.50', border: 2, borderColor: 'primary.main' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" fontWeight="bold">
                                Your Review
                            </Typography>
                            <Chip 
                                icon={<CheckCircleIcon />} 
                                label="Published" 
                                color="success" 
                                size="small" 
                            />
                        </Box>
                        <Button 
                            startIcon={<EditIcon />}
                            onClick={handleEditReview}
                            size="small"
                        >
                            Edit Review
                        </Button>
                    </Stack>
                    <Rating value={Number(userReview.rating)} readOnly size="large" sx={{ mb: 2 }} />
                    {userReview.comment && (
                        <Typography variant="body1" color="text.secondary">
                            {userReview.comment}
                        </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        Posted on {new Date(userReview.created_at).toLocaleDateString()}
                    </Typography>
                </Paper>
            )}

            {/* Review Form (only for enrolled students without review OR when editing) */}
            {isLogged && isEnrolled && (!userReview || isEditing) && (
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        {userReview ? 'Edit Your Review' : 'Leave a Review'}
                    </Typography>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="body2" gutterBottom>
                                Your Rating
                            </Typography>
                            <Rating
                                value={userRating}
                                onChange={(e, newValue) => setUserRating(newValue)}
                                size="large"
                            />
                        </Box>
                        <TextField
                            label="Your Review (optional)"
                            multiline
                            rows={4}
                            value={userComment}
                            onChange={(e) => setUserComment(e.target.value)}
                            placeholder="Share your thoughts about this course..."
                        />
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="contained"
                                onClick={handleSubmitReview}
                                disabled={isSubmitting || !userRating}
                                fullWidth
                            >
                                {isSubmitting 
                                    ? "Submitting..." 
                                    : userReview 
                                        ? "Update Review" 
                                        : "Submit Review"
                                }
                            </Button>
                            {userReview && isEditing && (
                                <Button
                                    variant="outlined"
                                    onClick={handleCancelEdit}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                            )}
                        </Stack>
                    </Stack>
                </Paper>
            )}

            {/* Other Students' Reviews */}
            <Typography variant="h5" fontWeight="bold" gutterBottom>
                {reviews.length > 0 ? 'Other Student Reviews' : 'Student Reviews'}
            </Typography>

            {reviews.length > 0 ? (
                <Stack spacing={2}>
                    {reviews.map((review) => (
                        <Paper key={review.id} elevation={1} sx={{ p: 3 }}>
                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    {review.name?.[0] || 'U'}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {review.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </Typography>
                                    </Stack>
                                    <Rating value={Number(review.rating)} readOnly size="small" sx={{ mb: 1 }} />
                                    {review.comment && (
                                        <Typography variant="body2" color="text.secondary">
                                            {review.comment}
                                        </Typography>
                                    )}
                                </Box>
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            ) : (
                <Alert severity="info">
                    {userReview 
                        ? "Be the first to share your thoughts with other students!"
                        : "No reviews yet. Be the first to review this course!"
                    }
                </Alert>
            )}
        </Box>
    );
}