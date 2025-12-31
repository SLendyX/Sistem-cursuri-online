// client/src/LessonEditor.jsx (Updated)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router';
import {
    Box, TextField, Typography, Button, Paper, Stack, List, ListItem, ListItemText,
    CircularProgress, Tooltip, IconButton, Dialog, DialogContent, DialogTitle, Tabs, Tab
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddLinkIcon from '@mui/icons-material/AddLink';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import LessonPreview from '../student_experience/LessonPreview';

export default function LessonEditor() {
    const { lessonId } = useParams();
    const { items, setItems } = useOutletContext();

    // Data States
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [links, setLinks] = useState([]);

    // UI States
    const [saveStatus, setSaveStatus] = useState('saved');
    const [lastSaved, setLastSaved] = useState(null);
    const [tabValue, setTabValue] = useState(0); // 0 = Edit, 1 = Preview
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [newLinkLabel, setNewLinkLabel] = useState('');
    const [version, setVersion] = useState(1);
    const [isLoaded, setIsLoaded] = useState(false);
    
    const dataRef = useRef({ id: lessonId, title, content, videoUrl, links, version });
    const isDirtyRef = useRef(false);
    const saveControllerRef = useRef(null);
    const saveSeqRef = useRef(0);
    
    useEffect(() => {
        dataRef.current = { id: lessonId, title, content, videoUrl, links, version };
    }, [lessonId, title, content, videoUrl, links, version]);
    
    const saveLesson = useCallback(async (data, { isUnmounting = false } = {}) => {
        const seq = ++saveSeqRef.current;
        if (!isUnmounting) setSaveStatus('saving');
        const minDelay = new Promise(resolve => setTimeout(resolve, 800));

        // Abort any in-flight save before starting a new one (unless we intentionally keep it)
        if (!isUnmounting && saveControllerRef.current) saveControllerRef.current.abort();
        const controller = new AbortController();
        saveControllerRef.current = controller;

        try {
            const fetchPromise = fetch(`/api/lessons/${data.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, version: data.version }),
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
                    setSaveStatus('error');
                    if (errBody.currentVersion) setVersion(errBody.currentVersion);
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
    
    // 1. LOAD DATA
    // When lessonId changes: flush pending save for previous lesson, then load the new one
    useEffect(() => {
        let isMounted = true;

        const loadLesson = async () => {
            if (isDirtyRef.current) {
                await saveLesson({ ...dataRef.current }, { isUnmounting: true });
            }

            setIsLoaded(false);
            setTitle(""); setContent(""); setVideoUrl(""); setLinks([]);

            try {
                const res = await fetch(`/api/lessons/${lessonId}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                if (isMounted) {
                    const { title, content, video_url, links } = data;
                    setTitle(title || "");
                    setContent(content || "");
                    setVideoUrl(video_url || "");
                    setLinks(links || []);
                    setVersion(data.version || 1);
                    isDirtyRef.current = false;
                    setSaveStatus('saved');
                    setIsLoaded(true);
                }
            } catch (err) {
                console.error("Load failed", err);
            }
        };

        loadLesson();

        return () => { isMounted = false; };
    }, [lessonId, saveLesson]);

    // Video embed helper
    const getVideoEmbed = (url) => {
        if (!url) return null;

        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            let videoId = "";
            try {
                if (url.includes("watch?v=")) videoId = url.split("watch?v=")[1].split("&")[0];
                else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split("?")[0];
                else if (url.includes("embed/")) videoId = url.split("embed/")[1];
            } catch (e) { return null; }
            if (!videoId) return null;
            return { type: 'iframe', src: `https://www.youtube.com/embed/${videoId}` };
        }

        if (url.includes("vimeo.com")) {
            const vimeoId = url.split("vimeo.com/")[1]?.split("/")[0];
            if (vimeoId) return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeoId}` };
        }

        if (url.match(/\.(mp4|webm|ogg)$/i)) {
            return { type: 'video', src: url };
        }

        return null;
    };

    // 2. SAVE FUNCTION

    // 3. AUTO-SAVE
    useEffect(() => {
        if (!isLoaded) return;
        if (!title && !content && !videoUrl) return;
        isDirtyRef.current = true;

        const timer = setTimeout(() => {
            saveLesson(dataRef.current);
        }, 2000);

        return () => clearTimeout(timer);
    }, [title, content, videoUrl, links, lessonId, saveLesson, isLoaded]);

    // Cleanup & Exit Saves
    useEffect(() => {
        return () => {
            if (isDirtyRef.current) saveLesson(dataRef.current, { isUnmounting: true });
        };
    }, [lessonId, saveLesson]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (isDirtyRef.current) saveLesson(dataRef.current, { isUnmounting: true });
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [saveLesson]);

    // Handlers
    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        setItems(prev => prev.map(i => i.id === Number(lessonId) ? { ...i, title: newTitle } : i));
    };

    const handleAddLink = () => {
        if (newLinkUrl && newLinkLabel) {
            setLinks([...links, { url: newLinkUrl, label: newLinkLabel }]);
            setNewLinkUrl(''); setNewLinkLabel('');
        }
    };

    const handleDeleteLink = (index) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const getStatusIcon = () => {
        switch (saveStatus) {
            case 'saving': return <CircularProgress size={20} color="inherit" />;
            case 'saved': return <CloudDoneIcon color="success" />;
            case 'error': return <ErrorOutlineIcon color="error" />;
            default: return <CloudDoneIcon color="disabled" />;
        }
    };

    const embedInfo = getVideoEmbed(videoUrl);

    return (
        <Box maxWidth="md" mx="auto">
            {/* Header with Tab Switcher */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}
                sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 1 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight="bold">Edit Lesson</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : 'Changes save automatically'}
                    </Typography>
                </Box>

                {/* Tab Switcher */}
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab icon={<EditIcon />} label="Edit" />
                    <Tab icon={<VisibilityIcon />} label="Preview" />
                </Tabs>

                <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {saveStatus === 'saving' ? 'Saving...' : saveStatus}
                    </Typography>
                    <Tooltip title={saveStatus === 'error' ? "Failed to save" : "Auto-save active"}>
                        <Box sx={{ display: 'flex' }}>{getStatusIcon()}</Box>
                    </Tooltip>
                </Stack>
            </Stack>

            {/* Conditional Rendering: Edit vs Preview */}
            {tabValue === 0 ? (
                <>
                    {/* EDIT MODE */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Stack spacing={3}>
                            <TextField
                                label="Lesson Title" variant="outlined" fullWidth
                                value={title} onChange={handleTitleChange}
                            />

                            <TextField
                                label="Video URL" variant="outlined" fullWidth
                                placeholder="YouTube, Vimeo, or MP4 Link"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                slotProps={{ input: { startAdornment: <PlayCircleOutlineIcon color="action" sx={{ mr: 1 }} /> } }}
                            />

                            {embedInfo && (
                                <Box sx={{ mt: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd', bgcolor: '#000' }}>
                                    <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                                        {embedInfo.type === 'iframe' ? (
                                            <iframe
                                                src={embedInfo.src}
                                                title="Video Preview"
                                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        ) : (
                                            <video
                                                src={embedInfo.src}
                                                controls
                                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                            />
                                        )}
                                    </Box>
                                </Box>
                            )}

                            <TextField
                                label="Content (Markdown)" multiline minRows={10} variant="outlined" fullWidth
                                value={content} onChange={(e) => setContent(e.target.value)}
                                helperText="Supports Markdown: **bold**, *italic*, # Heading, - lists, etc."
                            />
                        </Stack>
                    </Paper>

                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Resources</Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
                            <TextField label="Link Label" size="small" fullWidth value={newLinkLabel} onChange={(e) => setNewLinkLabel(e.target.value)} />
                            <TextField label="URL" size="small" fullWidth value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} />
                            <Button variant="outlined" startIcon={<AddLinkIcon />} onClick={handleAddLink}>Add</Button>
                        </Stack>
                        <List>
                            {links.map((link, index) => (
                                <ListItem key={index} divider secondaryAction={
                                    <IconButton edge="end" color="error" onClick={() => handleDeleteLink(index)}><DeleteIcon /></IconButton>
                                }>
                                    <ListItemText primary={link.label} secondary={link.url} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </>
            ) : (
                // PREVIEW MODE
                <LessonPreview 
                    title={title}
                    content={content}
                    videoUrl={videoUrl}
                    links={links}
                />
            )}
        </Box>
    );
}