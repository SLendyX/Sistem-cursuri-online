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
    const [version, setVersion] = useState(1);
    const [isLoaded, setIsLoaded] = useState(false);

    const dataRef = useRef({ id: chapterId, title, isPublished, version });
    const currentIdRef = useRef(chapterId);
    const isDirtyRef = useRef(false);
    const saveControllerRef = useRef(null);
    const saveSeqRef = useRef(0);

    useEffect(() => {
        // Keep dataRef in sync with latest fields but use the stable id stored in currentIdRef
        dataRef.current = { id: currentIdRef.current, title, isPublished, version };
    }, [title, isPublished, version]);

    const saveChapter = useCallback(async (data, { isUnmounting = false } = {}) => {
        const seq = ++saveSeqRef.current;
        if (!isUnmounting) setSaveStatus('saving');
        const minDelay = new Promise(resolve => setTimeout(resolve, 800));

        // Abort any in-flight save before starting a new one (unless we intentionally keep it)
        if (!isUnmounting && saveControllerRef.current) saveControllerRef.current.abort();
        const controller = new AbortController();
        saveControllerRef.current = controller;

        try {
            const fetchPromise = fetch(`/api/chapters/${data.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title,
                    isPublished: data.isPublished ? 1 : 0,
                    version: data.version
                }),
                keepalive: true,
                signal: controller.signal
            });

            if (isUnmounting) {
                fetchPromise.catch(e => console.error("Exit save failed", e));
                return;
            }

            const [response] = await Promise.all([fetchPromise, minDelay]);
            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                if (response.status === 409) {
                    showAlert("Content was updated elsewhere. Reloading...", "warning");

                    // Reload fresh data from server
                    const freshData = await fetch(`/api/chapters/${chapterId}`)
                        .then(r => r.json());

                    // Update local state with server data
                    setTitle(freshData.title || "");
                    setIsPublished(Boolean(freshData.is_published));
                    setVersion(freshData.version || 1);

                    setSaveStatus('error');
                    showAlert("Your changes were discarded. Please review and save again.", "error");
                    return;
                }

                throw new Error(errBody.error || "Save failed");
            }
            if (seq !== saveSeqRef.current) return; // Ignore stale response

            setSaveStatus('saved');
            setLastSaved(new Date());
            isDirtyRef.current = false;
            const resJson = await response.json().catch(() => ({}));
            if (resJson?.version) setVersion(resJson.version);

        } catch (error) {
            if (error?.name === 'AbortError') return;
            console.error("Auto-save failed:", error);
            if (!isUnmounting) setSaveStatus('error');
        }
    }, []);

    // When chapterId changes: flush any pending save for the previous chapter, then load the new one
    useEffect(() => {
        let isMounted = true;

        const loadChapter = async () => {
            // Finish pending save for previous chapter before loading the new one
            if (isDirtyRef.current) {
                const prevSnapshot = { ...dataRef.current };
                await saveChapter(prevSnapshot, { isUnmounting: true });
            }

            setIsLoaded(false);
            setTitle(""); 
            
            try {
                const res = await fetch(`/api/chapters/${chapterId}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                if (isMounted) {
                    currentIdRef.current = chapterId; // update stable id only after load succeeds
                    dataRef.current = {
                        id: chapterId,
                        title: data.title || "",
                        isPublished: Boolean(data.is_published),
                        version: data.version || 1
                    };

                    setTitle(data.title || "");
                    setIsPublished(Boolean(data.is_published));
                    setVersion(data.version || 1);
                    isDirtyRef.current = false;
                    setSaveStatus('saved');
                    setIsLoaded(true);
                }
            } catch (err) {
                console.error("Load failed", err);
            }
        };

        loadChapter();

        return () => { isMounted = false; };
    }, [chapterId, saveChapter]);

    useEffect(() => {
        if (!isLoaded) return;
        if (!title && !isDirtyRef.current) return;
        isDirtyRef.current = true;
        const snapshot = { ...dataRef.current };
        const timer = setTimeout(() => saveChapter(snapshot), 1500);
        return () => clearTimeout(timer);
    }, [title, isPublished, saveChapter, isLoaded]);

    useEffect(() => {
        return () => {
            if (isDirtyRef.current) {
                const snapshot = { ...dataRef.current };
                saveChapter(snapshot, { isUnmounting: true });
            }
        };
    }, [saveChapter]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (isDirtyRef.current) {
                const snapshot = { ...dataRef.current };
                saveChapter(snapshot, { isUnmounting: true });
            }
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

    console.log(dataRef.current, isDirtyRef.current)

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