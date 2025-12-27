import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router';
import {
    Box, TextField, Typography, Paper, Stack,
    CircularProgress, Tooltip, MenuItem, InputAdornment, Button, Card, CardMedia
} from '@mui/material';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export default function CourseEditor() {
    const { courseId } = useParams();
    
    // Data States
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('usor');
    const [price, setPrice] = useState('');
    const [thumbnail, setThumbnail] = useState(null); // URL for preview
    const [selectedFile, setSelectedFile] = useState(null); // File object for upload

    // UI States
    const [saveStatus, setSaveStatus] = useState('saved');
    const [lastSaved, setLastSaved] = useState(null);

    // Refs for "Exit Save"
    const dataRef = useRef({ id: courseId, title, description, difficulty, price });
    const isDirtyRef = useRef(false);

    useEffect(() => {
        dataRef.current = { id: courseId, title, description, difficulty, price };
    }, [title, description, difficulty, price, courseId]);

    // 1. LOAD DATA
    useEffect(() => {
        let isMounted = true;
        
        fetch(`/api/courses/${courseId}`)
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                if (isMounted) {
                    setTitle(data.nume_curs || "");
                    setDescription(data.descriere || "");
                    setDifficulty(data.dificultate || "usor");
                    setPrice(data.pret || "");
                    setThumbnail(data.thumbnail_url || "");
                    
                    isDirtyRef.current = false;
                    setSaveStatus('saved');
                }
            })
            .catch(err => console.error("Load failed", err));

        return () => { isMounted = false; };
    }, [courseId]);

    // 2. SAVE FUNCTION (Handles Text + File)
    const saveCourse = useCallback(async (data, fileToUpload) => {
        setSaveStatus('saving');
        const minDelay = new Promise(resolve => setTimeout(resolve, 800));

        try {
            // We must use FormData because we might be sending a file
            const formData = new FormData();
            formData.append('numeCurs', data.title);
            formData.append('descriere', data.description);
            formData.append('dificultate', data.difficulty);
            formData.append('pret', data.price);
            
            if (fileToUpload) {
                formData.append('image', fileToUpload);
            }

            const fetchPromise = fetch(`/api/courses/${data.id}`, {
                method: 'PATCH',
                body: formData, // No Content-Type header (browser sets it for FormData)
                keepalive: true
            });

            const [response] = await Promise.all([fetchPromise, minDelay]);
            
            if (!response.ok) throw new Error("Save failed");
            
            // Update thumbnail preview if server sent back a new URL
            const resData = await response.json();
            if (resData.newImage) setThumbnail(resData.newImage);

            setSaveStatus('saved');
            setLastSaved(new Date());
            isDirtyRef.current = false;
            setSelectedFile(null); // Reset file selection after upload

        } catch (error) {
            console.error("Auto-save failed:", error);
            setSaveStatus('error');
        }
    }, []);

    // 3. AUTO-SAVE TRIGGER (Text Changes)
    useEffect(() => {
        if (!title && !isDirtyRef.current) return;
        isDirtyRef.current = true;

        const dataToSave = { id: courseId, title, description, difficulty, price };
        const timer = setTimeout(() => saveCourse(dataToSave, null), 1500);

        return () => clearTimeout(timer);
    }, [title, description, difficulty, price, courseId, saveCourse]);

    // 4. IMMEDIATE SAVE (File Upload)
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Show local preview immediately
            setThumbnail(URL.createObjectURL(file));
            setSelectedFile(file);
            // Save immediately
            saveCourse(dataRef.current, file);
        }
    };

    // Helper for Status Icon
    const getStatusIcon = () => {
        switch (saveStatus) {
            case 'saving': return <CircularProgress size={20} color="inherit" />;
            case 'saved': return <CloudDoneIcon color="success" />;
            case 'error': return <ErrorOutlineIcon color="error" />;
            default: return <CloudDoneIcon color="disabled" />;
        }
    };

    return (
        <Box maxWidth="md" mx="auto">
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}
                sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 1 }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold">Course Settings</Typography>
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
                    {/* Thumbnail Upload */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <Card sx={{ width: 200, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
                            {thumbnail ? (
                                <CardMedia component="img" height="120" image={thumbnail} alt="Course Thumbnail" />
                            ) : (
                                <Typography variant="caption" color="text.secondary">No Image</Typography>
                            )}
                        </Card>
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>Course Thumbnail</Typography>
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<CloudUploadIcon />}
                                size="small"
                            >
                                Upload Image
                                <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                            </Button>
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                                Recommended size: 1280x720 (16:9)
                            </Typography>
                        </Box>
                    </Box>

                    <TextField
                        label="Course Title" variant="outlined" fullWidth
                        value={title} onChange={(e) => setTitle(e.target.value)}
                    />

                    <TextField
                        label="Description" multiline minRows={4} variant="outlined" fullWidth
                        value={description} onChange={(e) => setDescription(e.target.value)}
                    />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            select label="Difficulty" fullWidth
                            value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <MenuItem value="usor">Beginner (Usor)</MenuItem>
                            <MenuItem value="mediu">Intermediate (Mediu)</MenuItem>
                            <MenuItem value="avansat">Advanced (Avansat)</MenuItem>
                        </TextField>

                        <TextField
                            label="Price" type="number" fullWidth
                            value={price} onChange={(e) => setPrice(e.target.value)}
                            slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                        />
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}