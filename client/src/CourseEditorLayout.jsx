import React, { useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
    Box,
    Drawer,
    AppBar,        
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    CssBaseline,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArticleIcon from '@mui/icons-material/Article';

const drawerWidth = 300;

function SortableSidebarItem({ id, title, active, onClick }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    
    return (
        <ListItem ref={setNodeRef} style={style} disablePadding secondaryAction={
                <IconButton {...attributes} {...listeners} sx={{ cursor: 'grab' }}><DragIndicatorIcon /></IconButton>
            }>
            <ListItemButton selected={active} onClick={onClick}>
                <ListItemIcon><ArticleIcon /></ListItemIcon>
                <ListItemText primary={title} />
            </ListItemButton>
        </ListItem>
    );
}

export default function CourseEditorLayout() {
    const navigate = useNavigate();
    const { courseId, lessonId } = useParams();
    const [items, setItems] = useState([
        { id: '1', title: 'Introduction' },
        { id: '2', title: 'Setup Environment' },
        { id: '3', title: 'First Component' },
    ]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    function handleDragEnd(event) {
        const { active, over } = event;
        if (active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
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
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Curriculum
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                <List>
                                    {items.map((item) => (
                                        <SortableSidebarItem 
                                            key={item.id} 
                                            id={item.id} 
                                            title={item.title} 
                                            active={lessonId === item.id} 
                                            onClick={() => navigate(`/instructor/course/${courseId}/edit/lesson/${item.id}`)} 
                                        />
                                    ))}
                                </List>
                            </SortableContext>
                        </DndContext>
                    </Box>
                </Drawer>

                <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
                    <Outlet context={{ items, setItems }} />
                </Box>
            </Box>
        </Box>
    );
}