import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useParams, useMatch, useLocation } from "react-router"; // 👈 Added useLocation
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { LoggedInContext } from "./context/LoggedInContext";

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
import DeleteIcon from '@mui/icons-material/Delete'

const drawerWidth = 300;

// --- 1. Updated Sortable Item (Accepts onDoubleClick) ---
function SortableSidebarItem({ id, title, type, active, onClick, onDoubleClick, onContextMenu }) { // 👈 Added onDoubleClick
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
                onDoubleClick={onDoubleClick} // 👈 Connected Handler
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

// --- 2. Main Layout Component ---
export default function CourseEditorLayout() {
    const navigate = useNavigate();
    const location = useLocation(); // 👈 To read query params
    const { courseId, chapterId } = useParams();
    const { showAlert } = React.useContext(LoggedInContext);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Route Matchers
    const chapterMatch = useMatch("/instructor/course/:courseId/edit/chapter/:chapterId/*");
    const currentChapterId = chapterMatch?.params?.chapterId;

    const lessonMatch = useMatch("/instructor/course/:courseId/edit/chapter/:chapterId/lesson/:lessonId");
    const currentLessonId = lessonMatch?.params?.lessonId;

    // --- NEW LOGIC: Determine Mode ---
    // We are in "Lesson List Mode" (ChapterMode) ONLY if:
    // 1. We are deep inside a lesson (lessonMatch is true)
    // 2. OR we explicitly have '?view=lessons' in the URL (from double click)
    const searchParams = new URLSearchParams(location.search);
    const isLessonView = searchParams.get('view') === 'lessons';

    const isChapterMode = Boolean(currentLessonId || isLessonView);

    // --- State ---
    const [chapters, setChapters] = useState([]);
    const [lessons, setLessons] = useState([]);

    // Derived state
    const activeList = isChapterMode ? lessons : chapters;
    const setActiveList = isChapterMode ? setLessons : setChapters;

    // --- Context Menu State ---
    const [contextMenu, setContextMenu] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

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
        const endpoint = selectedItem.type === 'chapter'
            ? `/api/chapters/${selectedItem.id}`
            : `/api/lessons/${selectedItem.id}`;

        try {
            const res = await fetch(endpoint, { method: 'DELETE' });
            if (!res.ok) throw new Error("Delete failed");
            setActiveList((items) => items.filter((i) => i.id !== selectedItem.id));
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
        const newOrderedList = arrayMove(activeList, oldIndex, newIndex);

        setActiveList(newOrderedList);

        const endpoint = isChapterMode ? '/api/lessons/reorder' : '/api/chapters/reorder';

        fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: newOrderedList })
        })
            .then(res => {
                if (!res.ok) throw new Error("Reorder failed");
            })
            .catch(err => {
                showAlert(err || "Reordering failed", "error")
            });
    }

    // --- CLICK HANDLERS (UPDATED) ---

    // 1. Single Click: Just Select / Edit Properties
    function handleItemClick(id) {
        if (isChapterMode) {
            // Already inside a chapter? Click opens the Lesson Editor
            navigate(`chapter/${currentChapterId}/lesson/${id}`);
        } else {
            // Viewing Chapter List? Single click opens Chapter Editor
            // BUT keeps the sidebar showing chapters (no ?view=lessons)
            navigate(`chapter/${id}`);
        }
    }

    // 2. Double Click: Drill Down
    function handleItemDoubleClick(id) {
        if (!isChapterMode) {
            // Switch to "Lesson View" for this chapter
            navigate(`chapter/${id}?view=lessons`);
        }
    }

    // 3. Back Button
    function handleBackClick() {
        // Go back to the Course Root (clears ID and query params)
        navigate(`/instructor/course/${courseId}/edit`);
    }

    useEffect(() => {
        updateChapters()
        setLessons([])
    }, [courseId]);

    // Update lessons when we enter a chapter (either via ID or view mode)
    useEffect(() => {
        if (chapterId) {
            updateLessons();
        }
    }, [chapterId]); // Removed explicit null check, standard check is fine


    function addModule() {
        fetch("/api/chapters", {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId })
        })
            .then(async res => {
                const data = await res.json()
                if (!res.ok) throw new Error(data.error);
                updateChapters()
                if (showAlert) showAlert(data.message, "success");
            })
            .catch(err => showAlert(err.message || "Failed to add module", "error"));
    }

    function updateChapters() {
        fetch(`/api/courses/${courseId}/chapters?t=${new Date().getTime()}`)
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                // Ensure type is set for delete logic
                const formattedData = data.map(c => ({ ...c, type: 'chapter' }));
                setChapters(formattedData);
            })
            .catch(err => showAlert(err.message || "Failed to show chapters", "error"));
    }

    function addLesson() {
        fetch("/api/lessons", {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chapterId })
        })
            .then(async res => {
                const data = await res.json()
                if (!res.ok) throw new Error(data.error);
                updateLessons()
                if (showAlert) showAlert(data.message, "success");
            })
            .catch(err => showAlert(err.message || "Failed to add lesson", "error"));
    }

    function updateLessons() {
        if (!chapterId) return; // Safety check
        fetch(`/api/chapters/${chapterId}/lessons?t=${new Date().getTime()}`)
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                // Ensure type is set for delete logic
                const formattedData = data.map(l => ({ ...l, type: 'lesson' }));
                setLessons(formattedData)
            })
            .catch(err => showAlert(err.message || "Failed to show lessons", "error"));
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

                        {/* HEADER */}
                        {isChapterMode ? (
                            // STATE 1: Deep inside a Chapter (Viewing Lesson List)
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
                            // STATE 2: Viewing Chapter List
                            <Box sx={{ mb: 2 }}>
                                {/* 👇 NEW: If a chapter is selected, show button to go back to Root */}
                                {chapterId && (
                                    <Button
                                        startIcon={<ArrowBackIcon />}
                                        onClick={() => navigate(`/instructor/course/${courseId}/edit`)}
                                        size="small"
                                        sx={{ mb: 1 }}
                                    >
                                        Back to Course
                                    </Button>
                                )}

                                <Typography variant="subtitle1" fontWeight="bold">
                                    Course Curriculum
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {/* Context-aware helper text */}
                                    {chapterId
                                        ? "Editing Chapter Details"
                                        : "Double-click to edit lessons"
                                    }
                                </Typography>
                            </Box>
                        )}

                        <Divider sx={{ mb: 2 }} />

                        {/* DRAG AND DROP LIST */}
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
                                            type={item.type}
                                            // 👈 Logic: Active depends on what list is showing
                                            active={isChapterMode ? Number(currentLessonId) === item.id : Number(currentChapterId) === item.id}
                                            onClick={() => handleItemClick(item.id)}
                                            onDoubleClick={() => handleItemDoubleClick(item.id)} // 👈 Double Click
                                            onContextMenu={(e) => handleContextMenu(e, item)}
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

                {/* Popups & Dialogs */}
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
                    <Outlet context={{ items: activeList, setItems: setActiveList }} />
                </Box>
            </Box>
        </Box >
    );
}