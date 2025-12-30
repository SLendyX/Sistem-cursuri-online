// client/src/LessonPlayer.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router';
import { LoggedInContext } from './context/LoggedInContext';
import LessonPreview from './LessonPreview';
import {
    Box, Button, Stack, Checkbox, FormControlLabel,
    Paper, Typography, CircularProgress, Divider
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export default function LessonPlayer() {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const { showAlert } = useContext(LoggedInContext);
    const { completedLessons, setCompletedLessons, chapters } = useOutletContext();

    const [lessonData, setLessonData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);

    // Find current lesson and its neighbors
    const allLessons = chapters.flatMap(ch =>
        ch.lessons?.map(l => ({ ...l, chapterId: ch.id })) || []
    );
    const currentIndex = allLessons.findIndex(l => l.id === Number(lessonId));
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

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

                    {/* Next Button */}
                    <Button
                        variant="contained"
                        endIcon={<NavigateNextIcon />}
                        disabled={!nextLesson}
                        onClick={() => nextLesson && handleNavigation(nextLesson.id)}
                    >
                        {nextLesson ? "Next Lesson" : "Course Complete"}
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}