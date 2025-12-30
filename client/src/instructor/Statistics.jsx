import React, { useState, useEffect, useContext } from 'react';
import { LoggedInContext } from '../context/LoggedInContext';
import {
    Container, Paper, Typography, Box, Grid, Card, CardContent,
    CircularProgress, Divider, List, ListItem, ListItemText, Avatar
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export default function Statistics() {
    const { showAlert } = useContext(LoggedInContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/instructor/statistics')
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                return data;
            })
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                showAlert(err.message || "Failed to load statistics", "error");
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!stats) {
        return (
            <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    Failed to load statistics
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Instructor Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Overview of your teaching performance
            </Typography>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                                    <SchoolIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {stats.totalCourses}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Courses
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                                    <PeopleIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {stats.totalStudents}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Students
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                                    <AttachMoneyIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        ${stats.totalRevenue.toFixed(2)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Revenue
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                                    <TrendingUpIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold" noWrap>
                                        {stats.mostPopularCourse}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Most Popular ({stats.mostPopularCourseStudents} students)
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Course Breakdown */}
            <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Course Performance
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {stats.courses.length > 0 ? (
                    <List>
                        {stats.courses.map((course, index) => (
                            <ListItem
                                key={course.id}
                                divider={index < stats.courses.length - 1}
                                sx={{ py: 2 }}
                            >
                                <ListItemText
                                    primary={
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {course.name}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Students:</strong> {course.students}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Price:</strong> ${course.price}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Revenue:</strong> ${(course.students * course.price).toFixed(2)}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                        No courses created yet
                    </Typography>
                )}
            </Paper>
        </Container>
    );
}