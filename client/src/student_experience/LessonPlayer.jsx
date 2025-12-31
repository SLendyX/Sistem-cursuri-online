// client/src/LessonPlayer.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router';
import { LoggedInContext } from '../context/LoggedInContext';
import LessonPreview from './LessonPreview';
import Breadcrumbs from '../components/Breadcrumbs';
import {
    Box, Button, Stack, Checkbox, FormControlLabel,
    Paper, Typography, CircularProgress, Dialog, DialogTitle,
    DialogContent, DialogActions, Container
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';


export default function LessonPlayer() {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const { showAlert } = useContext(LoggedInContext);
    const { completedLessons, setCompletedLessons, chapters, courseInfo } = useOutletContext();

    const [lessonData, setLessonData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);
    const [showCongrats, setShowCongrats] = useState(false);

    // Find current lesson and its neighbors
    const allLessons = chapters.flatMap(ch =>
        ch.lessons?.map(l => ({ ...l, chapterId: ch.id })) || []
    );
    const currentIndex = allLessons.findIndex(l => l.id === Number(lessonId));
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
    const isLastLesson = !nextLesson;

    // Load lesson content
    useEffect(() => {
        setIsLoading(true);
        fetch(`/api/lessons/${lessonId}`)
            .then(res => res.json())
            .then(data => {
                setLessonData(data);
                setIsCompleted(completedLessons.has(Number(lessonId)));
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                showAlert("Failed to load lesson", "error");
                setIsLoading(false);
            });
    }, [lessonId, completedLessons]);

    // Mark as complete handler
    const handleToggleComplete = async (checked) => {
        try {
            const res = await fetch(`/api/progress/lesson/${lessonId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCompleted: checked })
            });

            if (!res.ok) throw new Error("Failed to update progress");

            setIsCompleted(checked);
            setCompletedLessons(prev => {
                const newSet = new Set(prev);
                if (checked) {
                    newSet.add(Number(lessonId));
                } else {
                    newSet.delete(Number(lessonId));
                }
                return newSet;
            });

            showAlert(checked ? "Lesson marked as complete!" : "Lesson unmarked", "success");
        } catch (err) {
            console.error(err);
            showAlert("Failed to update progress", "error");
        }
    };

    const handleNavigation = (targetLessonId) => {
        navigate(`/course/${courseId}/learn/lesson/${targetLessonId}`);
    };

    const handleFinishCourse = () => {
        // Check if current lesson is marked complete
        if (!isCompleted) {
            showAlert("Please mark this lesson as complete before finishing the course", "warning");
            return;
        }
        setShowCongrats(true);
    };

    const handleCloseCongrats = () => {
        setShowCongrats(false);
        navigate(`/courses/${courseId}`);
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!lessonData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="h6" color="text.secondary">
                    Lesson not found
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Main Content (Scrollable) */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Container maxWidth="lg">
                    <Breadcrumbs
                        customItems={[
                            { label: 'Courses', path: '/my-learning' },
                            { label: courseInfo?.nume_curs || 'Course', path: `/courses/${courseId}` },
                            { label: 'Learn', path: `/course/${courseId}/learn` },
                            { label: lessonData?.title || 'Lesson', path: '' }
                        ]}
                    />
                </Container>
                <LessonPreview
                    title={lessonData.title}
                    content={lessonData.content}
                    videoUrl={lessonData.video_url}
                    links={lessonData.links}
                />
            </Box>

            {/* Bottom Navigation Bar (Fixed) */}
            <Paper
                elevation={3}
                sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    position: 'sticky',
                    bottom: 0,
                    bgcolor: 'background.paper',
                    zIndex: 1
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    {/* Previous Button */}
                    <Button
                        variant="outlined"
                        startIcon={<NavigateBeforeIcon />}
                        disabled={!prevLesson}
                        onClick={() => prevLesson && handleNavigation(prevLesson.id)}
                    >
                        Previous
                    </Button>

                    {/* Complete Checkbox */}
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isCompleted}
                                onChange={(e) => handleToggleComplete(e.target.checked)}
                                icon={<CheckCircleOutlineIcon />}
                                checkedIcon={<CheckCircleOutlineIcon />}
                                color="success"
                            />
                        }
                        label={
                            <Typography variant="body2" fontWeight={isCompleted ? 'bold' : 'normal'}>
                                {isCompleted ? "Completed" : "Mark as Complete"}
                            </Typography>
                        }
                    />

                    {/* Next / Finish Button */}
                    {isLastLesson ? (
                        <Button
                            variant="contained"
                            color="success"
                            endIcon={<EmojiEventsIcon />}
                            onClick={handleFinishCourse}
                        >
                            Finish Course
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            endIcon={<NavigateNextIcon />}
                            onClick={() => handleNavigation(nextLesson.id)}
                        >
                            Next Lesson
                        </Button>
                    )}
                </Stack>
            </Paper>

            {/* Congratulations Dialog */}
            <Dialog
                open={showCongrats}
                onClose={handleCloseCongrats}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
                    <EmojiEventsIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
                    <Typography variant="h4" fontWeight="bold">
                        Congratulations! 🎉
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        You've completed "{courseInfo?.nume_curs}"
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Great job! You've finished all lessons in this course.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleCloseCongrats}
                    >
                        Back to Course Page
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}