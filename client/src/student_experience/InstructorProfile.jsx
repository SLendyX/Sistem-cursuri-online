// client/src/InstructorProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import CourseCard from '../course_componenents/CourseCard';
import {
    Container, Box, Typography, Avatar, Paper, Grid, Chip,
    CircularProgress, Divider, Stack, Card, CardContent
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';

export default function InstructorProfile() {
    const { instructorId } = useParams();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/instructor/${instructorId}`)
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                return data;
            })
            .then(data => {
                setProfileData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                navigate('/courses');
            });
    }, [instructorId]);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!profileData) {
        return (
            <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h5" color="text.secondary">
                    Instructor not found
                </Typography>
            </Container>
        );
    }

    const { instructor, courses, stats } = profileData;

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
            {/* Hero Section */}
            <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 6 }}>
                <Container maxWidth="lg">
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
                        <Avatar
                            sx={{
                                width: 150,
                                height: 150,
                                bgcolor: 'white',
                                color: 'primary.main',
                                fontSize: '4rem',
                                fontWeight: 'bold'
                            }}
                        >
                            {instructor.name?.[0] || 'I'}
                        </Avatar>
                        <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                                {instructor.name}
                            </Typography>
                            <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                                @{instructor.username}
                            </Typography>
                            <Chip
                                icon={<SchoolIcon />}
                                label="Instructor"
                                sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 'bold' }}
                            />
                        </Box>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 6 }}>
                {/* Statistics Cards */}
                <Grid container spacing={3} sx={{ mb: 6 }}>
                    <Grid item xs={12} sm={4}>
                        <Card elevation={2}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                                    <SchoolIcon fontSize="large" />
                                </Avatar>
                                <Typography variant="h4" fontWeight="bold">
                                    {stats.totalCourses}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Courses Published
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Card elevation={2}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                                    <PeopleIcon fontSize="large" />
                                </Avatar>
                                <Typography variant="h4" fontWeight="bold">
                                    {stats.totalStudents}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Students
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Card elevation={2}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                                    <StarIcon fontSize="large" />
                                </Avatar>
                                <Typography variant="h4" fontWeight="bold">
                                    {stats.avgRating.toFixed(1)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Average Rating
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Divider sx={{ mb: 4 }} />

                {/* Courses Section */}
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Courses by {instructor.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Explore all {stats.totalCourses} courses taught by this instructor
                </Typography>

                {courses.length > 0 ? (
                    <Grid container spacing={3}>
                        {courses.map((course) => (
                            <Grid item key={course.curs_id} xs={12} sm={6} md={4}>
                                <CourseCard curs={course} />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Paper elevation={1} sx={{ p: 6, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            No courses available yet
                        </Typography>
                    </Paper>
                )}
            </Container>
        </Box>
    );
}