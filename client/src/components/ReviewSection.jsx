// client/src/components/ReviewSection.jsx
import React, { useState, useEffect, useContext } from 'react';
import { LoggedInContext } from '../context/LoggedInContext';
import {
    Box, Paper, Typography, Rating, TextField, Button, Avatar,
    Stack, Divider, Alert, CircularProgress
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

export default function ReviewSection({ courseId, isEnrolled }) {
    const { isLogged, userData, showAlert } = useContext(LoggedInContext);
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [loading, setLoading] = useState(true);
    
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
            
            setReviews(data.reviews || []);
            setAverageRating(data.averageRating || 0);
            setTotalReviews(data.totalReviews || 0);
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

            showAlert("Review submitted successfully!", "success");
            setUserRating(0);
            setUserComment('');
            fetchReviews(); // Refresh reviews
        } catch (err) {
            showAlert(err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Reviews Summary */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Typography variant="h4" fontWeight="bold">
                        {averageRating.toFixed(1)}
                    </Typography>
                    <Box>
                        <Rating value={averageRating} precision={0.1} readOnly size="large" />
                        <Typography variant="body2" color="text.secondary">
                            Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            {/* Review Form (only for enrolled students) */}
            {isLogged && isEnrolled && (
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Leave a Review
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
                        <Button
                            variant="contained"
                            onClick={handleSubmitReview}
                            disabled={isSubmitting || !userRating}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Review"}
                        </Button>
                    </Stack>
                </Paper>
            )}

            {/* Reviews List */}
            <Typography variant="h5" fontWeight="bold" gutterBottom>
                Student Reviews
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
                                    <Rating value={review.rating} readOnly size="small" sx={{ mb: 1 }} />
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
                    No reviews yet. Be the first to review this course!
                </Alert>
            )}
        </Box>
    );
}