import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import { LoggedInContext } from './context/LoggedInContext';
import {
    Container, Typography, Box, Grid, Card, CardMedia, CardContent,
    CircularProgress, Chip, Button, LinearProgress, Divider
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import SchoolIcon from '@mui/icons-material/School';

export default function MyLearning() {
    const navigate = useNavigate();
    const { showAlert } = useContext(LoggedInContext);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/enrollments')
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                return data;
            })
            .then(data => {
                setEnrollments(data);
                setLoading(false);
            })
            .catch(err => {
                showAlert(err.message || "Failed to load your courses", "error");
                setLoading(false);
            });
    }, []);

    const handleContinue = (courseId) => {
        navigate(`/course/${courseId}/learn`);
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 5 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    My Learning
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Continue your learning journey
                </Typography>
                <Divider sx={{ mt: 2, maxWidth: 100, bgcolor: 'primary.main', borderBottomWidth: 3 }} />
            </Box>

            {enrollments.length > 0 ? (
                <Grid container spacing={3}>
                    {enrollments.map((enrollment) => {
                        const progress = enrollment.progress_percentage || 0;
                        const difficultyColor = 
                            enrollment.dificultate === "usor" ? "success" : 
                            enrollment.dificultate === "mediu" ? "warning" : "error";

                        return (
                            <Grid item key={enrollment.course_id} xs={12} sm={6} md={4}>
                                <Card 
                                    sx={{ 
                                        height: '100%', 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        transition: '0.3s',
                                        '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
                                    }}
                                >
                                    <CardMedia
                                        component="img"
                                        height="140"
                                        image={enrollment.thumbnail_url || '/images/default.jpg'}
                                        alt={enrollment.nume_curs}
                                    />

                                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Typography variant="h6" component="div" sx={{ lineHeight: 1.2, flex: 1 }}>
                                                {enrollment.nume_curs}
                                            </Typography>
                                            <Chip 
                                                label={enrollment.dificultate} 
                                                color={difficultyColor}
                                                size="small"
                                                sx={{ ml: 1 }}
                                            />
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            by {enrollment.instructor_name}
                                        </Typography>

                                        {/* Progress Bar */}
                                        <Box sx={{ mt: 'auto' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={progress} 
                                                    sx={{ flex: 1, height: 8, borderRadius: 1 }}
                                                />
                                                <Typography variant="caption" fontWeight="bold" sx={{ ml: 1 }}>
                                                    {progress}%
                                                </Typography>
                                            </Box>

                                            <Button
                                                variant="contained"
                                                fullWidth
                                                startIcon={<PlayCircleOutlineIcon />}
                                                onClick={() => handleContinue(enrollment.course_id)}
                                                sx={{ mt: 2 }}
                                            >
                                                {progress > 0 ? "Continue Learning" : "Start Course"}
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <SchoolIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                        No courses yet
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Start learning by enrolling in a course
                    </Typography>
                    <Button 
                        variant="contained" 
                        size="large"
                        onClick={() => navigate('/courses')}
                    >
                        Browse Courses
                    </Button>
                </Box>
            )}
        </Container>
    );
}