import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    Box, TextField, Typography, Paper, Stack,
    CircularProgress, Tooltip, MenuItem, InputAdornment, Button, Card, CardMedia,
    FormControlLabel, Switch, Dialog, DialogTitle, DialogContent, DialogActions,
    DialogContentText, Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { LoggedInContext } from "../context/LoggedInContext";

import StatusIcon from '../components/StatusIcon';
//hook
import useAutoSave from '../hooks/useAutoSave';

export default function CourseEditor({courseId, initialData, queryClient}) {
    const navigate = useNavigate();
    const { showAlert } = React.useContext(LoggedInContext);

    // Data States
    const [title, setTitle] = useState(initialData?.nume_curs || '');
    const [description, setDescription] = useState(initialData?.descriere || '');
    const [difficulty, setDifficulty] = useState(initialData?.dificultate || 'usor');
    const [price, setPrice] = useState(initialData?.pret || '');
    const [isPublished, setIsPublished] = useState(Boolean(initialData?.is_published));
    const [category, setCategory] = useState(initialData?.category || 'General');
    const [version, setVersion] = useState(initialData?.version || 1);
    
    const [thumbnail, setThumbnail] = useState(initialData?.thumbnail_url || null);
    const [imageFile, setImageFile] = useState(null);   

    // Delete Dialog States
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // 2. CORE SAVE FUNCTION
    // Designed to work even if the component is unmounting (fire-and-forget)
    const handleSaveApi = useCallback(async (dataToSave) => {
        const formData = new FormData();

        // Map hook data back to Backend Field Names
        formData.append('numeCurs', dataToSave.title);
        formData.append('descriere', dataToSave.description);
        formData.append('dificultate', dataToSave.difficulty);
        formData.append('pret', dataToSave.price);
        formData.append('isPublished', dataToSave.isPublished ? 1 : 0);
        formData.append('category', dataToSave.category);

        // CRITICAL: Send the version from State (not dataToSave) to prevent race conditions
        formData.append('version', version);

        // Handle Image
        if (dataToSave.imageFile) {
            formData.append('image', dataToSave.imageFile);
        }

        const response = await fetch(`/api/courses/${courseId}`, {
            method: 'PATCH',
            body: formData,
            keepalive: true, // Important for tab closing
        });

        if (!response.ok) {
            // Throw object with status so the hook can catch 409
            const err = new Error("Save failed");
            err.status = response.status;
            throw err;
        }

        const resData = await response.json();

        // Update local state after successful save
        if (resData.version) setVersion(resData.version);
        if (resData.newImage) {
            setThumbnail(resData.newImage);
            setImageFile(null); // Clear the file input so we don't re-upload it next time
        }

    }, [courseId, version]); // Dependencies

    //Conflict function
    const handleConflict = () => {
        showAlert("Sync conflict! Reloading data...", "warning");
        queryClient.invalidateQueries(['course', courseId]); // Re-fetch automatically
    };

    const { status: saveStatus, lastSaved } = useAutoSave({
        data: { 
            id: courseId, 
            title, 
            description, 
            difficulty, 
            price, 
            isPublished, 
            category,
            // JSON.stringify(file) is empty, so we need the fingerprint to detect changes
            imageFile, 
            imageFingerprint: imageFile ? `${imageFile.name}-${imageFile.lastModified}` : null
        }, 
        onSave: handleSaveApi,
        onConflict: handleConflict
    });


    // 4. FILE UPLOAD HANDLER
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Update preview immediately
            setThumbnail(URL.createObjectURL(file));
            // Update state -> Triggers Hook -> Triggers Save
            setImageFile(file); 
        }
    };

    // 5. DELETE COURSE
    const handleDeleteCourse = async () => {
        if (deleteConfirmText !== title) {
            showAlert("Course name doesn't match.", "warning");
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                showAlert(data.error || "Could not delete", "error");
                setIsDeleting(false);
                return;
            }

            showAlert("Course deleted", "success");
            navigate('/instructor/my_courses');
        } catch (err) {
            showAlert(err.message, "error");
            setIsDeleting(false);
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
                        <Box sx={{ display: 'flex' }}>
                            <StatusIcon saveStatus={saveStatus}/>
                        </Box>
                    </Tooltip>
                </Stack>
            </Stack>

            <Paper sx={{ p: 3, mb: 3 }}>
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

                    <TextField
                        select label="Category" fullWidth
                        value={category} onChange={(e) => setCategory(e.target.value)}
                    >
                        <MenuItem value="Programming">Programming</MenuItem>
                        <MenuItem value="Design">Design</MenuItem>
                        <MenuItem value="Business">Business</MenuItem>
                        <MenuItem value="Marketing">Marketing</MenuItem>
                        <MenuItem value="Photography">Photography</MenuItem>
                        <MenuItem value="Music">Music</MenuItem>
                        <MenuItem value="Language">Language</MenuItem>
                        <MenuItem value="Health & Fitness">Health & Fitness</MenuItem>
                        <MenuItem value="General">General</MenuItem>
                    </TextField>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={isPublished}
                                onChange={(e) => setIsPublished(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Published (Visible to students)"
                    />
                </Stack>
            </Paper>

            {/* Danger Zone */}
            <Paper sx={{ p: 3, borderColor: 'error.main', border: 2 }}>
                <Typography variant="h6" color="error" gutterBottom>Danger Zone</Typography>
                <Button
                    variant="outlined" color="error"
                    startIcon={<DeleteForeverIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                >
                    Delete Course
                </Button>
            </Paper>

            <Dialog open={deleteDialogOpen} onClose={() => !isDeleting && setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ color: 'error.main' }}>Delete Course: {title}</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Type the course name to confirm deletion.
                    </DialogContentText>
                    <TextField
                        autoFocus fullWidth variant="outlined" placeholder={title}
                        value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
                        disabled={isDeleting}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>Cancel</Button>
                    <Button onClick={handleDeleteCourse} color="error" variant="contained" disabled={isDeleting || deleteConfirmText !== title}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}