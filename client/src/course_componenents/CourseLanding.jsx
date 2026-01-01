import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router';
import { LoggedInContext } from '../context/LoggedInContext';
import {
    Container, Box, Typography, Button, Paper, Grid, Chip, Avatar,
    List, ListItem, ListItemIcon, ListItemText, Divider, Card, CardMedia,
    CircularProgress, Stack, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import ReviewSection from '../components/ReviewSection';
import Breadcrumbs from '../components/BreadCrumbs';

export default function CourseLanding() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { isLogged, showAlert, userData } = useContext(LoggedInContext);

    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch(`/api/courses/${courseId}`).then(r => r.json()),
            fetch(`/api/courses/${courseId}/chapters`).then(r => r.json()),
            isLogged ? fetch(`/api/check-enrollment/${courseId}`).then(r => r.json()) : Promise.resolve({ isEnrolled: false })
        ])
            .then(([courseData, chaptersData, enrollmentData]) => {
                setCourse(courseData);

                const chapterPromises = chaptersData.map(chapter =>
                    fetch(`/api/chapters/${chapter.id}/lessons`).then(r => r.json())
                        .then(lessons => ({ ...chapter, lessons }))
                );

                return Promise.all([Promise.all(chapterPromises), enrollmentData]);
            })
            .then(([chaptersWithLessons, enrollmentData]) => {
                setChapters(chaptersWithLessons);
                setIsEnrolled(enrollmentData.isEnrolled);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                showAlert("Failed to load course", "error");
                setIsLoading(false);
            });
    }, [courseId, isLogged]);

    const handleEnroll = async () => {
        if (!isLogged) {
            showAlert("Please login to enroll", "info");
            navigate('/login');
            return;
        }

        // REMOVED PROFESSOR RESTRICTION - Professors can now enroll too!

        setIsEnrolling(true);
        try {
            const res = await fetch(`/api/enroll/${courseId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Enrollment failed");
            }

            setIsEnrolled(true);
            showAlert("Successfully enrolled! Starting course...", "success");

            if (chapters.length > 0 && chapters[0].lessons?.length > 0) {
                const firstLessonId = chapters[0].lessons[0].id;
                navigate(`/course/${courseId}/learn/lesson/${firstLessonId}`);
            }
        } catch (err) {
            console.error(err);
            showAlert(err.message, "error");
        } finally {
            setIsEnrolling(false);
        }
    };

    const handleGoToCourse = () => {
        if (chapters.length > 0 && chapters[0].lessons?.length > 0) {
            const firstLessonId = chapters[0].lessons[0].id;
            navigate(`/course/${courseId}/learn/lesson/${firstLessonId}`);
        }
    };

    const totalLessons = chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0);
    const totalDuration = "4 hours";

    if (isLoading) {
        return (
            <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!course) {
        return (
            <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h5" color="text.secondary">
                    Course not found
                </Typography>
            </Container>
        );
    }

    const difficultyColor =
        course.dificultate === "usor" ? "success" :
            course.dificultate === "mediu" ? "warning" : "error";

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
            {/* Hero Section */}
            <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 8 }}>
                <Container maxWidth="xl"> {/* Changed from "lg" to "xl" */}
                    <Grid container spacing={4} alignItems="center" justifyContent="center">
                        <Grid item xs={12} md={6} lg={5}> {/* Limited width on large screens */}
                            <Chip
                                label={course.dificultate}
                                color={difficultyColor}
                                size="small"
                                sx={{ mb: 2 }}
                            />
                            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                                {course.nume_curs}
                            </Typography>
                            <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
                                {course.descriere}
                            </Typography>

                            <Stack direction="row" spacing={3} sx={{ mb: 3 }} flexWrap="wrap">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SchoolIcon />
                                    <Typography>{totalLessons} Lessons</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AccessTimeIcon />
                                    <Typography>{totalDuration}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon />
                                    <Typography>{course.studenti_inrolati || 0} Students</Typography>
                                </Box>
                            </Stack>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <Typography variant="h4" fontWeight="bold">
                                    {course.pret > 0 ? `$${course.pret}` : "Free"}
                                </Typography>

                                {/* Show appropriate button based on user status */}
                                {userData?.id === course.autor_id ? (
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={() => navigate(`/instructor/course/${courseId}/edit`)}
                                        sx={{ px: 4 }}
                                    >
                                        Edit Course
                                    </Button>
                                ) : isEnrolled ? (
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={handleGoToCourse}
                                        sx={{ px: 4 }}
                                    >
                                        Continue Learning
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={handleEnroll}
                                        disabled={isEnrolling}
                                        sx={{ px: 4 }}
                                    >
                                        {isEnrolling ? "Enrolling..." : course.pret > 0 ? "Buy Now" : "Enroll For Free"}
                                    </Button>
                                )}
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6} lg={5}> {/* Limited width & centered */}
                            <Card elevation={8} sx={{ borderRadius: 2, maxWidth: 600, mx: 'auto' }}>
                                <CardMedia
                                    component="img"
                                    sx={{
                                        height: { xs: 200, sm: 300, md: 350 },
                                        objectFit: 'cover'
                                    }}
                                    image={course.thumbnail_url || '/images/default.jpg'}
                                    alt={course.nume_curs}
                                />
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Course Content */}
            <Container maxWidth="lg" sx={{ py: 6 }}>
                <Breadcrumbs
                    customItems={[
                        { label: 'Courses', path: '/courses' },
                        { label: course?.nume_curs || 'Course', path: `/courses/${courseId}` }
                    ]}
                />
                <Grid container spacing={4}>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            What You'll Learn
                        </Typography>
                        <List>
                            <ListItem>
                                <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                                <ListItemText primary="Master the fundamentals" />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                                <ListItemText primary="Build real-world projects" />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                                <ListItemText primary="Gain practical experience" />
                            </ListItem>
                        </List>

                        <Divider sx={{ my: 4 }} />

                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Course Curriculum
                        </Typography>

                        <Box sx={{ mt: 2 }}>
                            {chapters.map((chapter, index) => (chapter.is_published === 1 &&
                                <Accordion key={chapter.id} defaultExpanded={index === 0}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {chapter.title}
                                            </Typography>
                                            <Chip
                                                label={`${chapter.lessons?.length || 0} lessons`}
                                                size="small"
                                            />
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <List dense>
                                            {chapter.lessons?.map((lesson) => (
                                                <ListItem key={lesson.id}>
                                                    <ListItemIcon>
                                                        {isEnrolled ? (
                                                            <PlayCircleOutlineIcon color="primary" />
                                                        ) : (
                                                            <LockIcon color="action" fontSize="small" />
                                                        )}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={lesson.title}
                                                        secondary={isEnrolled ? null : "Unlock with enrollment"}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: 20 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                This course includes:
                            </Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemIcon><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                                    <ListItemText primary={`${totalLessons} video lessons`} />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Lifetime access" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Mobile and desktop access" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Certificate of completion" />
                                </ListItem>
                            </List>

                            {!isEnrolled && (
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    onClick={handleEnroll}
                                    disabled={isEnrolling}
                                    sx={{ mt: 2 }}
                                >
                                    {course.pret > 0 ? `Enroll Now - $${course.pret}` : "Enroll For Free"}
                                </Button>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
                <Box sx={{ mt: 6 }}>
                    <ReviewSection courseId={courseId} isEnrolled={isEnrolled} />
                </Box>
            </Container>
        </Box>
    );
}


/*
{
  "error": "(conn:24, no: 1054, SQLState: 42S22) Unknown column 'is_published' in 'WHERE'\nsql: SELECT DISTINCT category, COUNT(*) as count \n             FROM curs \n             WHERE is_published = 1 \n             GROUP BY category \n             ORDER BY category ASC - parameters:[]"
}
*/