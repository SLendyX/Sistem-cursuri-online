import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useParams, useMatch } from "react-router";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// MUI Imports
import {
    Box, Drawer, List, Typography, Divider, IconButton,
    ListItem, ListItemButton, ListItemText, ListItemIcon,
    CssBaseline, Button, Stack
} from '@mui/material';

// Icons
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArticleIcon from '@mui/icons-material/Article';
import FolderIcon from '@mui/icons-material/Folder'; // Icon for Chapters
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const drawerWidth = 300;

// --- 1. Reusable Sortable Item Component ---
function SortableSidebarItem({ id, title, type, active, onClick }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    
    const style = { 
        transform: CSS.Transform.toString(transform), 
        transition, 
        opacity: isDragging ? 0.5 : 1,
    };
    
    return (
        <ListItem ref={setNodeRef} style={style} disablePadding 
            secondaryAction={
                <IconButton {...attributes} {...listeners} sx={{ cursor: 'grab', touchAction: 'none' }}>
                    <DragIndicatorIcon />
                </IconButton>
            }
        >
            <ListItemButton selected={active} onClick={onClick}>
                <ListItemIcon>
                    {/* Different Icon based on Type */}
                    {type === 'chapter' ? <FolderIcon color="primary" /> : <ArticleIcon />}
                </ListItemIcon>
                <ListItemText primary={title} />
            </ListItemButton>
        </ListItem>
    );
}

// --- 2. Main Layout Component ---
export default function CourseEditorLayout() {
    const navigate = useNavigate();
    const { courseId } = useParams();
    
    // TRICK: Check if we are inside a chapter using useMatch
    // This allows the parent to know about the child's URL params
    const chapterMatch = useMatch("/instructor/course/:courseId/edit/chapter/:chapterId/*");
    const currentChapterId = chapterMatch?.params?.chapterId;

    // Check if we are inside a specific lesson
    const lessonMatch = useMatch("/instructor/course/:courseId/edit/chapter/:chapterId/lesson/:lessonId");
    const currentLessonId = lessonMatch?.params?.lessonId;

    // --- State ---
    // In a real app, you would fetch these from the DB based on courseId/currentChapterId
    const [chapters, setChapters] = useState([
        { id: 'c1', title: 'Module 1: Introduction', type: 'chapter' },
        { id: 'c2', title: 'Module 2: React Basics', type: 'chapter' },
        { id: 'c3', title: 'Module 3: Advanced Hooks', type: 'chapter' },
    ]);

    const [lessons, setLessons] = useState([
        { id: 'l1', title: 'Welcome Video', type: 'lesson' },
        { id: 'l2', title: 'Installation Guide', type: 'lesson' },
        { id: 'l3', title: 'Hello World', type: 'lesson' },
    ]);

    // Derived state: What list are we currently showing?
    const isChapterMode = Boolean(currentChapterId);
    const activeList = isChapterMode ? lessons : chapters;
    const setActiveList = isChapterMode ? setLessons : setChapters;

    // --- DND Sensors ---
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Fixes click vs drag conflict
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- Handlers ---
    function handleDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setActiveList((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
        
        // TODO: Call API to save new order
        // const endpoint = isChapterMode ? '/api/reorder-lessons' : '/api/reorder-chapters';
    }

    function handleItemClick(id) {
        if (isChapterMode) {
            // If showing lessons, click opens the Lesson Editor
            navigate(`chapter/${currentChapterId}/lesson/${id}`);
        } else {
            // If showing chapters, click "Drills Down" into the chapter
            // (In reality, you'd fetch the lessons for THIS chapter ID here)
            navigate(`chapter/${id}`);
        }
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
            <CssBaseline />

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <Drawer
                    variant="permanent"
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        [`& .MuiDrawer-paper`]: { 
                            width: drawerWidth, 
                            boxSizing: 'border-box',
                            position: 'relative',
                            height: '100%'        
                        },
                    }}
                >
                    <Box sx={{ overflow: 'auto', p: 2 }}>
                        
                        {/* HEADER: Shows "Back" button if deep inside a chapter */}
                        {isChapterMode ? (
                            <Box sx={{ mb: 2 }}>
                                <Button 
                                    startIcon={<ArrowBackIcon />} 
                                    onClick={() => navigate(`/instructor/course/${courseId}/edit`)}
                                    size="small"
                                    sx={{ mb: 1 }}
                                >
                                    Back to Modules
                                </Button>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Edit Chapter Content
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Reorder lessons below
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Course Curriculum
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Manage your modules
                                </Typography>
                            </Box>
                        )}

                        <Divider sx={{ mb: 2 }} />

                        {/* DRAG AND DROP LIST */}
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={activeList.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                <List sx={{overflowX:"hidden"}}>
                                    {activeList.map((item) => (
                                        <SortableSidebarItem 
                                            key={item.id} 
                                            id={item.id} 
                                            title={item.title} 
                                            type={item.type}
                                            // Highlight if this is the currently edited lesson
                                            active={currentLessonId === item.id} 
                                            onClick={() => handleItemClick(item.id)} 
                                        />
                                    ))}
                                </List>
                            </SortableContext>
                        </DndContext>
                        
                        <Button 
                            variant="outlined" 
                            fullWidth 
                            sx={{ mt: 2, borderStyle: 'dashed' }}
                        >
                            + Add {isChapterMode ? "Lesson" : "Module"}
                        </Button>
                    </Box>
                </Drawer>

                {/* MAIN CONTENT */}
                <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto', width:"100%" }}>
                    {/* CONTEXT PASSING:
                        We pass 'activeList' to the child. 
                        If the child is LessonEditor, it receives the Lessons list.
                    */}
                    <Outlet context={{ items: activeList, setItems: setActiveList }} />
                </Box>
            </Box>
        </Box>
    );
}