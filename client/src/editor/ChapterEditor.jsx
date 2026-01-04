import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useLocation } from 'react-router';
import {
    Box, TextField, Typography, Paper, Stack,
    CircularProgress, Tooltip, Switch, FormControlLabel
} from '@mui/material';
import StatusIcon from "../components/StatusIcon"

// ✅ Import the Hook
import useAutoSave from '../hooks/useAutoSave';

export default function ChapterEditor({chapterId, initialData, queryClient}) {
    const location = useLocation();
    const { setItems } = useOutletContext(); // Only need setItems for sidebar updates

    // Check query param
    const searchParams = new URLSearchParams(location.search);
    const isLessonView = searchParams.get('view') === 'lessons';

    // Data States
    const [title, setTitle] = useState(initialData?.title || "");
    const [isPublished, setIsPublished] = useState(Boolean(initialData?.is_published));
    const [version, setVersion] = useState(initialData?.version || 1);

    const handleTitleChange = (e) => setTitle(e.target.value);

    // 2. DEFINE SAVE FUNCTION
    const handleSaveApi = useCallback(async (dataToSave) => {
        const response = await fetch(`/api/author/chapters/${chapterId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: dataToSave.title,
                isPublished: dataToSave.isPublished ? 1 : 0,
                version: version // ✅ Use state version to prevent race conditions
            }),
            keepalive: true
        });

        if (!response.ok) {
            const err = new Error("Save failed");
            err.status = response.status;
            throw err;
        }

        const resData = await response.json();

        // Update local version
        if (resData.version) setVersion(resData.version);

        // ✅ Update Sidebar Context immediately
        setItems(prev => prev.map(item =>
            item.id === Number(chapterId) && item.type === 'chapter'
                ? { ...item, title: dataToSave.title }
                : item
        ));

    }, [chapterId, version, setItems]);

    // 3. DEFINE CONFLICT HANDLER
    const handleConflict = () => {
        // Simple reload logic
        showAlert("Sync conflict! Reloading data...", "warning");
        queryClient.invalidateQueries(['chapter', chapterId]);
    };

    // 4. USE THE HOOK
    const { status: saveStatus, lastSaved } = useAutoSave({
        data: {
            id: chapterId,
            title,
            isPublished
        },
        onSave: handleSaveApi,
        onConflict: handleConflict,
    });


    // 5. VIEW LOGIC
    if (isLessonView) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
                <Typography variant="h6">Select a lesson from the sidebar to edit content</Typography>
            </Box>
        );
    }

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
                        <Box sx={{ display: 'flex' }}>
                            <StatusIcon saveStatus={saveStatus}/>
                        </Box>
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