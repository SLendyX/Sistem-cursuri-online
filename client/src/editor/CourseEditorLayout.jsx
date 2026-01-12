// client/src/editor/CourseEditorLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useParams, useMatch, useLocation } from "react-router";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { LoggedInContext } from "../context/LoggedInContext";
import { useQueryClient } from "@tanstack/react-query";

// MUI Imports
import {
    Box, Drawer, List, Typography, Divider, IconButton,
    ListItem, ListItemButton, ListItemText, ListItemIcon,
    CssBaseline, Button, Menu, MenuItem, Stack, Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions
} from '@mui/material';

// Icons
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArticleIcon from '@mui/icons-material/Article';
import FolderIcon from '@mui/icons-material/Folder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';

// 1. IMPORT BREADCRUMBS
import Breadcrumbs from '../components/BreadCrumbs';
import { useCourseStructure } from "../hooks/useCourseStructure";

const drawerWidth = 300;

function SortableSidebarItem({ id, title, type, active, onClick, onDoubleClick, onContextMenu }) {
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
            <ListItemButton
                selected={active}
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onContextMenu={onContextMenu}
            >
                <ListItemIcon>
                    {type === 'chapter' ? <FolderIcon color="primary" /> : <ArticleIcon />}
                </ListItemIcon>
                <ListItemText primary={title} />
            </ListItemButton>
        </ListItem>
    );
}

export default function CourseEditorLayout({courseId, lessonId, chapterId, initialData, isChapterMode, queryClient}) {
    const navigate = useNavigate();
    const { showAlert } = React.useContext(LoggedInContext);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Route Matchers
    // const chapterMatch = useMatch("/instructor/course/:courseId/edit/chapter/:chapterId/*");
    // const chapterId = chapterMatch?.params?.chapterId;

    // const lessonMatch = useMatch("/instructor/course/:courseId/edit/chapter/:chapterId/lesson/:lessonId");
    // const lessonId = lessonMatch?.params?.lessonId;

    // const searchParams = new URLSearchParams(location.search);
    // const isLessonView = searchParams.get('view') === 'lessons';
    // const isChapterMode = Boolean(lessonId || isLessonView);

    // const { data, isLoading, isFetching } = useCourseStructure(courseId);

    // --- State ---
    const chapters = initialData?.chapters || [];
    const activeChapter = chapters.find(c => c.id == chapterId);
    const lessons = activeChapter?.lessons || [];

    const [courseTitle, setCourseTitle] = useState(initialData?.course.nume_curs || ""); // 2. NEW STATE FOR TITLE

    // Derived state
    const [activeList, setActiveList] = useState(isChapterMode ? lessons : chapters);

    // --- Context Menu State ---
    const [contextMenu, setContextMenu] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        setActiveList(isChapterMode ? lessons : chapters)
    }, [isChapterMode, chapters, lessons])


    // 4. GENERATE BREADCRUMBS
    const getBreadcrumbs = () => {
        // Base Path
        const items = [
            { label: 'Instructor Panel', path: '/instructor' },
            { label: 'My Courses', path: '/instructor/my_courses' },
            { label: courseTitle || 'Course', path: `/instructor/course/${courseId}/edit` }
        ];

        // If inside a Chapter
        if (chapterId) {
            const currentChapter = chapters.find(c => c.id === Number(chapterId));
            items.push({
                label: currentChapter?.title || 'Chapter',
                // Clicking this keeps us in "edit details" mode unless we explicitly want list view
                path: `/instructor/course/${courseId}/edit/chapter/${chapterId}`
            });
        }

        // If inside a Lesson
        if (lessonId) {
            const currentLesson = lessons.find(l => l.id === Number(lessonId));
            items.push({
                label: currentLesson?.title || 'Lesson',
                path: '' // Current page, no link needed
            });
        }

        return items;
    };

    const handleContextMenu = (event, item) => {
        event.preventDefault();
        setSelectedItem(item);
        setContextMenu(
            contextMenu === null
                ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6 }
                : null,
        );
    };

    const handleCloseMenu = () => {
        setContextMenu(null);
        setSelectedItem(null);
    };

    const handleFullClose = () => {
        setDeleteDialogOpen(false);
        setContextMenu(null);
        setSelectedItem(null);
    };

    const handleDeleteItem = async () => {
        if (!selectedItem) return;
        onClickDeleteOption();
    };

    const onClickDeleteOption = () => {
        setContextMenu(null);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        console.log(selectedItem)

        const endpoint = selectedItem.type === 'chapter'
            ? `/api/author/chapters/${selectedItem.id}`
            : `/api/author/lessons/${selectedItem.id}`;

        try {
            const res = await fetch(endpoint, { method: 'DELETE' });
            if (!res.ok) throw new Error("Delete failed");
            await queryClient.invalidateQueries(['course', courseId, 'structure']);
        } catch (error) {
            console.error(error);
            showAlert("Failed to delete item")
        }
        setDeleteDialogOpen(false);
        handleCloseMenu();
    };

    // --- DND Sensors ---
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    function handleDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = activeList.findIndex((item) => item.id === active.id);
        const newIndex = activeList.findIndex((item) => item.id === over.id);

        // 1. Calculate new order
        const newOrderedList = arrayMove(activeList, oldIndex, newIndex);

        // 2. INSTANTLY update Local State (The user sees this immediately)
        setActiveList(newOrderedList);

        // 3. Send Request in Background
        const endpoint = isChapterMode ? '/api/author/lessons/reorder' : '/api/author/chapters/reorder';

        fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: newOrderedList })
        })
            .then(res => {
                if (!res.ok) throw new Error("Reorder failed");
                // Optional: Refetch to ensure data consistency, 
                // but since we updated local state, we don't strictly need to wait for this.
                queryClient.invalidateQueries(['chapter', chapterId]);
            })
            .catch(err => {
                // 4. Rollback on Error
                showAlert("Reorder failed, reverting...", "error");
                setActiveList(activeList); // Revert to the old list
            });
    }


    // --- CLICK HANDLERS ---
    function handleItemClick(id) {
        if (isChapterMode) {
            navigate(`chapter/${chapterId}/lesson/${id}`);
        } else {
            navigate(`chapter/${id}`);
        }
    }

    function handleItemDoubleClick(id) {
        if (!isChapterMode) {
            navigate(`chapter/${id}?view=lessons`);
        }
    }

    function handleBackClick() {
        navigate(`/instructor/course/${courseId}/edit`);
    }

    function addModule() {
        fetch("/api/author/chapters", {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId })
        })
            .then(async res => {
                const data = await res.json()
                if (!res.ok) throw new Error(data.error);
                queryClient.invalidateQueries(['course', courseId, 'structure']);
                if (showAlert) showAlert(data.message, "success");
            })
            .catch(err => showAlert(err.message || "Failed to add module", "error"));
    }

    function addLesson() {
        fetch("/api/author/lessons", {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chapterId })
        })
            .then(async res => {
                const data = await res.json()
                if (!res.ok) throw new Error(data.error);
                if (showAlert) showAlert(data.message, "success");
                await queryClient.invalidateQueries(['course', courseId, 'structure']);
            })
            .catch(err => showAlert(err.message || "Failed to add lesson", "error"));
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
                        {isChapterMode ? (
                            <Box sx={{ mb: 2 }}>
                                <Button
                                    startIcon={<ArrowBackIcon />}
                                    onClick={handleBackClick}
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
                                {chapterId && (
                                    <Button
                                        startIcon={<ArrowBackIcon />}
                                        onClick={() => navigate(`/instructor/course/${courseId}/edit`)}
                                        size="small"
                                        sx={{ mb: 1 }}
                                    >
                                        Back to Course
                                    </Button>
                                ) || <Box sx={{ overflow: 'auto', p: 2, marginBottom: "8px" }} > </Box>}

                                <Typography variant="subtitle1" fontWeight="bold">
                                    Course Curriculum
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {chapterId ? "Editing Chapter Details" : "Double-click to edit lessons"}
                                </Typography>
                            </Box>
                        )}

                        <Divider sx={{ mb: 2 }} />

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                        >
                            <SortableContext items={activeList.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                <List sx={{ overflowX: "hidden" }}>
                                    {activeList.map((item) => (
                                        <SortableSidebarItem
                                            key={item.id}
                                            id={item.id}
                                            title={item.title}
                                            type={isChapterMode ? "lesson" : "chapter"}
                                            active={isChapterMode ? Number(lessonId) === item.id : Number(chapterId) === item.id}
                                            onClick={() => handleItemClick(item.id)}
                                            onDoubleClick={() => handleItemDoubleClick(item.id)}
                                            onContextMenu={(e) => handleContextMenu(e, {...item, type: isChapterMode ? "lesson" : "chapter"})}
                                        />
                                    ))}
                                </List>
                            </SortableContext>
                        </DndContext>

                        <Button
                            variant="outlined"
                            fullWidth
                            sx={{ mt: 2, borderStyle: 'dashed' }}
                            onClick={isChapterMode ? addLesson : addModule}
                        >
                            + Add {isChapterMode ? "Lesson" : "Module"}
                        </Button>
                    </Box>
                </Drawer>

                <Menu
                    open={contextMenu !== null}
                    onClose={handleCloseMenu}
                    anchorReference="anchorPosition"
                    anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
                >
                    <MenuItem onClick={handleDeleteItem} sx={{ color: 'error.main' }}>
                        <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                        <ListItemText>Delete {selectedItem?.type}</ListItemText>
                    </MenuItem>
                </Menu>

                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete <b>{selectedItem?.title}</b>?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleFullClose}>Cancel</Button>
                        <Button onClick={confirmDelete} color="error" autoFocus>Delete</Button>
                    </DialogActions>
                </Dialog>

                {/* MAIN CONTENT */}
                <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto', width: "100%" }}>
                    {/* 5. RENDER BREADCRUMBS BEFORE OUTLET */}
                    <Breadcrumbs customItems={getBreadcrumbs()} />
                    <Outlet context={{ items: activeList, setItems: setActiveList, courseId:courseId }} />
                </Box>
            </Box>
        </Box >
    );
}