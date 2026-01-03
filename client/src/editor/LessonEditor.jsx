// client/src/editor/LessonEditor.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // ✅ NEW
import {
    Box, TextField, Typography, Button, Paper, Stack, List, ListItem, ListItemText,
    CircularProgress, Tooltip, IconButton, Tabs, Tab
} from '@mui/material';

// Icons
import DeleteIcon from '@mui/icons-material/Delete';
import AddLinkIcon from '@mui/icons-material/AddLink';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';

import StatusIcon from '../components/StatusIcon';

// Components & Context
import LessonPreview from '../student_experience/LessonPreview';
import { LoggedInContext } from "../context/LoggedInContext";
import useAutoSave from '../hooks/useAutoSave'; // ✅ YOUR NEW HOOK

export default function LessonEditor({lessonId, initialData, queryClient}) {
    const { setItems } = useOutletContext();
    const { showAlert } = React.useContext(LoggedInContext);

    // ---------------------------------------------------------
    // 1. LOCAL STATE (For the form inputs)
    // ---------------------------------------------------------
    const [title, setTitle] = useState(initialData.title || '');
    const [content, setContent] = useState(initialData.content || '');
    const [videoUrl, setVideoUrl] = useState(initialData.video_url || '');
    const [links, setLinks] = useState(initialData?.links || []);
    const [version, setVersion] = useState(initialData?.version || 1);

    // UI States
    const [tabValue, setTabValue] = useState(0); // 0 = Edit, 1 = Preview
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [newLinkLabel, setNewLinkLabel] = useState('');

    // ---------------------------------------------------------
    // 1. DEFINE ACTIONS (Save & Conflict)
    // ---------------------------------------------------------
    const handleSaveApi = async (dataToSave) => {
        const payload = {
            ...dataToSave,
            version: version // ✅ Read the state variable here
        };

        const res = await fetch(`/api/lessons/${dataToSave.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
        });

        if (!res.ok) {
            const err = new Error("Save failed");
            err.status = res.status;
            throw err;
        }

        const json = await res.json();
        
        // Update version and Sidebar
        if (json.version) setVersion(json.version);
        if (setItems) {
            setItems(prev => prev.map(i => i.id === Number(lessonId) ? { ...i, title: dataToSave.title } : i));
        }
    };

    const handleConflict = () => {
        showAlert("Sync conflict! Reloading data...", "warning");
        queryClient.invalidateQueries(['lesson', lessonId]); // Re-fetch automatically
    };

    // ---------------------------------------------------------
    // 5. ACTIVATE AUTO-SAVE (The Hook)
    // ---------------------------------------------------------
    const { status, lastSaved } = useAutoSave({
        data: { id: lessonId, title, content, videoUrl, links },
        onSave: handleSaveApi,
        onConflict: handleConflict
    });

    // ---------------------------------------------------------
    // 6. HELPER FUNCTIONS (✅ KEEP THESE HERE)
    // ---------------------------------------------------------
    
    // Your video embed logic
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

    const handleTitleChange = (e) => setTitle(e.target.value);

    const handleAddLink = () => {
        if (newLinkUrl && newLinkLabel) {
            setLinks([...links, { url: newLinkUrl, label: newLinkLabel }]);
            setNewLinkUrl(''); setNewLinkLabel('');
        }
    };

    const handleDeleteLink = (index) => {
        setLinks(links.filter((_, i) => i !== index));
    };
    

    const embedInfo = getVideoEmbed(videoUrl); // ✅ Used here

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

                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab icon={<EditIcon />} label="Edit" />
                    <Tab icon={<VisibilityIcon />} label="Preview" />
                </Tabs>

                <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {status === 'saving' ? 'Saving...' : status}
                    </Typography>
                    <Tooltip title={status === 'error' ? "Failed to save" : "Auto-save active"}>
                        <Box sx={{ display: 'flex' }}>
                            <StatusIcon saveStatus={status}/>
                        </Box>
                    </Tooltip>
                </Stack>
            </Stack>

            {/* Content Area */}
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

                            {/* Video Preview Box */}
                            {embedInfo && (
                                <Box sx={{ mt: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd', bgcolor: '#000' }}>
                                    <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                                        {embedInfo.type === 'iframe' ? (
                                            <iframe
                                                src={embedInfo.src}
                                                title="Video Preview"
                                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                                frameBorder="0"
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
                                <ListItem
                                    key={index}
                                    divider
                                    secondaryAction={
                                        <IconButton edge="end" color="error" onClick={() => handleDeleteLink(index)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText
                                        primary={link.label}
                                        secondary={link.url}
                                    />
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