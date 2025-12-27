import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useOutletContext, useLocation } from 'react-router'; // 👈 1. Import useLocation
import {
    Box, TextField, Typography, Paper, Stack,
    CircularProgress, Tooltip, Switch, FormControlLabel
} from '@mui/material';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function ChapterEditor() {
    const { chapterId } = useParams();
    const location = useLocation(); // 👈 2. Get current location
    const { items, setItems } = useOutletContext(); 

    // 👇 3. Check for the query param
    const searchParams = new URLSearchParams(location.search);
    const isLessonView = searchParams.get('view') === 'lessons';

    // Data States
    const [title, setTitle] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [saveStatus, setSaveStatus] = useState('saved');
    const [lastSaved, setLastSaved] = useState(null);

    const dataRef = useRef({ id: chapterId, title, isPublished });
    const isDirtyRef = useRef(false);

    useEffect(() => {
        dataRef.current = { id: chapterId, title, isPublished };
    }, [chapterId, title, isPublished]);

    useEffect(() => {
        let isMounted = true;
        setTitle(""); 
        
        fetch(`/api/chapters/${chapterId}`)
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                if (isMounted) {
                    setTitle(data.title || "");
                    setIsPublished(Boolean(data.is_published));
                    isDirtyRef.current = false;
                    setSaveStatus('saved');
                }
            })
            .catch(err => console.error("Load failed", err));

        return () => { isMounted = false; };
    }, [chapterId]);

    const saveChapter = useCallback(async (data, { isUnmounting = false } = {}) => {
        if (!isUnmounting) setSaveStatus('saving');
        const minDelay = new Promise(resolve => setTimeout(resolve, 800));

        try {
            const fetchPromise = fetch(`/api/chapters/${data.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title,
                    isPublished: data.isPublished ? 1 : 0
                }),
                keepalive: true
            });

            if (isUnmounting) {
                fetchPromise.catch(e => console.error("Exit save failed", e));
                return;
            }

            const [response] = await Promise.all([fetchPromise, minDelay]);
            if (!response.ok) throw new Error("Save failed");

            setSaveStatus('saved');
            setLastSaved(new Date());
            isDirtyRef.current = false;

        } catch (error) {
            console.error("Auto-save failed:", error);
            if (!isUnmounting) setSaveStatus('error');
        }
    }, []);

    useEffect(() => {
        if (!title && !isDirtyRef.current) return;
        isDirtyRef.current = true;
        const dataToSave = { id: chapterId, title, isPublished };
        const timer = setTimeout(() => saveChapter(dataToSave), 1500);
        return () => clearTimeout(timer);
    }, [title, isPublished, chapterId, saveChapter]);

    useEffect(() => {
        return () => {
            if (isDirtyRef.current) saveChapter(dataRef.current, { isUnmounting: true });
        };
    }, [saveChapter]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (isDirtyRef.current) saveChapter(dataRef.current, { isUnmounting: true });
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [saveChapter]);

    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        setItems(prev => prev.map(i => i.id === Number(chapterId) ? { ...i, title: newTitle } : i));
    };

    const getStatusIcon = () => {
        switch (saveStatus) {
            case 'saving': return <CircularProgress size={20} color="inherit" />;
            case 'saved': return <CloudDoneIcon color="success" />;
            case 'error': return <ErrorOutlineIcon color="error" />;
            default: return <CloudDoneIcon color="disabled" />;
        }
    };

    // 👇 4. CONDITIONAL RENDER: If in "Lesson View", hide the editor
    if (isLessonView) {
        return (
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%', 
                color: 'text.secondary' 
            }}>
                <Typography variant="h6">
                    Select a lesson from the sidebar to edit content
                </Typography>
            </Box>
        );
    }

    // Otherwise, show the normal Chapter Editor
    return (
        <Box maxWidth="md" mx="auto">
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}
                sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 1 }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold">Edit Chapter</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : 'Changes save automatically'}
                    </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {saveStatus === 'saving' ? 'Saving...' : saveStatus}
                    </Typography>
                    <Tooltip title={saveStatus === 'error' ? "Failed to save" : "Auto-save active"}>
                        <Box sx={{ display: 'flex' }}>{getStatusIcon()}</Box>
                    </Tooltip>
                </Stack>
            </Stack>

            <Paper sx={{ p: 3 }}>
                <Stack spacing={3}>
                    <TextField
                        label="Chapter Title"
                        variant="outlined"
                        fullWidth
                        value={title}
                        onChange={handleTitleChange}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={isPublished}
                                onChange={(e) => setIsPublished(e.target.checked)}
                                color="primary"
                            />
                        }
                        label={
                            <Typography>
                                Published 
                                <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                    (Visible to students)
                                </Typography>
                            </Typography>
                        }
                    />
                </Stack>
            </Paper>
        </Box>
    );
}