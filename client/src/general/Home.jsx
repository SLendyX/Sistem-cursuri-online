import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router";
import CourseCard from "../course_componenents/CourseCard";
import { LoggedInContext } from '../context/LoggedInContext';

// MUI Imports
import {
    Container, Box, Typography, Button, Grid, Paper, Card, CardContent, Avatar,
    CircularProgress, Stack
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function Home() {
    const navigate = useNavigate();
    const [latestCourses, setLatestCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isLogged } = useContext(LoggedInContext);

    useEffect(() => {
        // Fetch only the latest 3 published courses
        fetch("/api/courses")
            .then(res => res.json())
            .then(data => {
                setLatestCourses(Array.isArray(data) ? data.slice(0, 3) : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <Box>
            {/* Hero Section */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    py: { xs: 8, md: 12 },
                    textAlign: 'center'
                }}
            >
                <Container maxWidth="md">
                    <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
                        Expand Your Knowledge
                    </Typography>
                    <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                        Browse courses from top instructors and start learning today
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/courses')}
                            sx={{
                                bgcolor: 'white',
                                color: 'primary.main',
                                px: 4,
                                py: 1.5,
                                '&:hover': { bgcolor: 'grey.100' }
                            }}
                            endIcon={<ArrowForwardIcon />}
                        >
                            Browse Courses
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/about')}
                            sx={{
                                borderColor: 'white',
                                color: 'white',
                                px: 4,
                                py: 1.5,
                                '&:hover': { borderColor: 'grey.300', bgcolor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            Learn More
                        </Button>
                    </Stack>
                </Container>
            </Box>

            {/* Features Section */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>
                    Why Choose Learnify?
                </Typography>
                <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6 }}>
                    Join thousands of learners advancing their skills
                </Typography>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Card elevation={2} sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                                <SchoolIcon fontSize="large" />
                            </Avatar>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Expert Instructors
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Learn from industry professionals with years of experience
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card elevation={2} sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                            <Avatar sx={{ bgcolor: 'success.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                                <GroupsIcon fontSize="large" />
                            </Avatar>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Learn Together
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Join a community of passionate learners and grow together
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card elevation={2} sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                            <Avatar sx={{ bgcolor: 'warning.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                                <EmojiObjectsIcon fontSize="large" />
                            </Avatar>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Practical Skills
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Gain real-world skills through hands-on projects and exercises
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>
            </Container>

            {/* Latest Courses Section */}
            <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Box>
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                                Latest Courses
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Start learning something new today
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/courses')}
                            sx={{ display: { xs: 'none', sm: 'block' } }}
                        >
                            View All
                        </Button>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : latestCourses.length > 0 ? (
                        <>
                            <Grid container spacing={3}>
                                {latestCourses.map((course, index) => (
                                    <Grid item key={index} xs={12} sm={6} md={4}>
                                        <CourseCard curs={course} />
                                    </Grid>
                                ))}
                            </Grid>
                            <Box sx={{ textAlign: 'center', mt: 4, display: { xs: 'block', sm: 'none' } }}>
                                <Button variant="outlined" fullWidth onClick={() => navigate('/courses')}>
                                    View All Courses
                                </Button>
                            </Box>
                        </>
                    ) : (
                        <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                            No courses available yet. Check back soon!
                        </Typography>
                    )}
                </Container>
            </Box>

            {/* Call to Action */}
            {!isLogged &&
                <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
                    <Paper elevation={3} sx={{ p: 6, borderRadius: 3, bgcolor: 'primary.main', color: 'white' }}>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            Ready to Start Learning?
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
                            Join thousands of students already learning on Learnify
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/register')}
                            sx={{
                                bgcolor: 'white',
                                color: 'primary.main',
                                px: 4,
                                py: 1.5,
                                '&:hover': { bgcolor: 'grey.100' }
                            }}
                        >
                            Get Started for Free
                        </Button>
                    </Paper>
                </Container>
            }
        </Box>
    );
}