// client/src/CoursePlayerLayout.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Outlet, useParams, useNavigate, useMatch } from 'react-router';
import { LoggedInContext } from '../context/LoggedInContext';
import {
    Box, Drawer, List, Typography, Divider, ListItem, ListItemButton, 
    ListItemText, ListItemIcon, Collapse, LinearProgress, CssBaseline,
    IconButton, Toolbar, AppBar, Chip
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ArticleIcon from '@mui/icons-material/Article';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const drawerWidth = 320;

export default function CoursePlayerLayout() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { userData, showAlert } = useContext(LoggedInContext);
    
    const lessonMatch = useMatch("/course/:courseId/learn/lesson/:lessonId");
    const currentLessonId = lessonMatch?.params?.lessonId;

    const [chapters, setChapters] = useState([]);
    const [courseInfo, setCourseInfo] = useState(null);
    const [completedLessons, setCompletedLessons] = useState(new Set());
    const [expandedChapters, setExpandedChapters] = useState({});
    const [mobileOpen, setMobileOpen] = useState(false);

    // Load course structure
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const res = await fetch(`/api/courses/${courseId}/structure`);
                if (!res.ok) throw new Error("Failed to load course structure");
                const { course, chapters } = await res.json();

                const progRes = await fetch(`/api/progress/${courseId}`);
                if (!progRes.ok) throw new Error("Failed to load progress");
                const progress = await progRes.json();

                if (cancelled) return;
                setCourseInfo(course);
                setChapters(chapters || []);
                setCompletedLessons(new Set(progress.completedLessonIds || []));

                const firstWithLessons = (chapters || []).find(
                    (ch) => ch.lessons && ch.lessons.length > 0
                );
                if (firstWithLessons) {
                    setExpandedChapters({ [firstWithLessons.id]: true });
                }
            } catch (err) {
                console.error(err);
                if (!cancelled) showAlert("Failed to load course content", "error");
            }
        };

        load();
        return () => { cancelled = true; };
    }, [courseId]);

    const handleToggleChapter = (chapterId) => {
        setExpandedChapters(prev => ({
            ...prev,
            [chapterId]: !prev[chapterId]
        }));
    };

    const handleLessonClick = (lessonId) => {
        navigate(`lesson/${lessonId}`);
        setMobileOpen(false);
    };

    const handleBackToCourses = () => {
        navigate(`/my-learning`)
    };

    const totalLessons = chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0);
    const progressPercent = totalLessons > 0 
        ? Math.round((completedLessons.size / totalLessons) * 100)
        : 0;

    const drawer = (
        <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Course Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <IconButton onClick={handleBackToCourses} size="small" sx={{ mb: 1 }}>
                    <ArrowBackIcon /> 
                </IconButton>
                <Typography variant="h6" fontWeight="bold" noWrap>
                    {courseInfo?.nume_curs || "Loading..."}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                    <LinearProgress 
                        variant="determinate" 
                        value={progressPercent} 
                        sx={{ flex: 1, height: 8, borderRadius: 1 }}
                    />
                    <Typography variant="caption" fontWeight="bold">
                        {progressPercent}%
                    </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                    {completedLessons.size} of {totalLessons} lessons completed
                </Typography>
            </Box>

            {/* Chapter/Lesson List */}
            <List sx={{ flex: 1, overflow: 'auto' }}>
                {chapters.map((chapter) => ( chapter.is_published === 1 &&
                    <React.Fragment key={chapter.id}>
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => handleToggleChapter(chapter.id)}>
                                <ListItemIcon>
                                    <FolderIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={chapter.title}
                                    primaryTypographyProps={{ fontWeight: 600 }}
                                />
                                {expandedChapters[chapter.id] ? <ExpandLess /> : <ExpandMore />}
                            </ListItemButton>
                        </ListItem>

                        <Collapse in={expandedChapters[chapter.id]} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                {chapter.lessons?.map((lesson) => {
                                    const isCompleted = completedLessons.has(lesson.id);
                                    const isActive = Number(currentLessonId) === lesson.id;

                                    return (
                                        <ListItem key={lesson.id} disablePadding>
                                            <ListItemButton
                                                selected={isActive}
                                                onClick={() => handleLessonClick(lesson.id)}
                                                sx={{ pl: 4 }}
                                            >
                                                <ListItemIcon>
                                                    {isCompleted ? (
                                                        <CheckCircleIcon color="success" fontSize="small" />
                                                    ) : (
                                                        <RadioButtonUncheckedIcon fontSize="small" color="action" />
                                                    )}
                                                </ListItemIcon>
                                                <ListItemText 
                                                    primary={lesson.title}
                                                    primaryTypographyProps={{ 
                                                        variant: 'body2',
                                                        color: isActive ? 'primary' : 'text.primary'
                                                    }}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </Collapse>
                    </React.Fragment>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <CssBaseline />

            {/* Mobile App Bar */}
            <AppBar
                position="fixed"
                sx={{
                    display: { sm: 'none' },
                    width: '100%',
                    ml: 0,
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        {courseInfo?.nume_curs}
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Sidebar Drawer */}
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                {/* Mobile drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>

                {/* Desktop drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { 
                            boxSizing: 'border-box', 
                            width: drawerWidth,
                            position: 'relative',
                            height: '100%'
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    height: '100vh',
                    overflow: 'auto',
                    mt: { xs: 7, sm: 0 } // Account for mobile app bar
                }}
            >
                <Outlet context={{ completedLessons, setCompletedLessons, chapters, courseInfo }} />
            </Box>
        </Box>
    );
}