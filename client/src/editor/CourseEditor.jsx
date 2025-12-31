import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import Breadcrumbs from '../components/Breadcrumbs';
import {
    Box, TextField, Typography, Paper, Stack,
    CircularProgress, Tooltip, MenuItem, InputAdornment, Button, Card, CardMedia,
    FormControlLabel, Switch, Dialog, DialogTitle, DialogContent, DialogActions,
    DialogContentText, Alert
} from '@mui/material';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { LoggedInContext } from "../context/LoggedInContext";

export default function CourseEditor() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { showAlert } = React.useContext(LoggedInContext);

    // Data States
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('usor');
    const [price, setPrice] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [thumbnail, setThumbnail] = useState(null);
    const [category, setCategory] = useState('General');
    const [version, setVersion] = useState(1);

    // UI States
    const [saveStatus, setSaveStatus] = useState('saved');
    const [lastSaved, setLastSaved] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Delete Dialog States
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // REFS: These hold the "Truth" for event listeners (like closing the tab)
    // that run outside the normal React render cycle.
    const dataRef = useRef({ id: courseId, title, description, difficulty, price, isPublished, category, version });
    const isDirtyRef = useRef(false);
    const isMountedRef = useRef(true);
    const saveControllerRef = useRef(null);
    const saveSeqRef = useRef(0);

    // Sync Data Ref whenever state changes
    useEffect(() => {
        dataRef.current = { id: courseId, title, description, difficulty, price, isPublished, category, version };
    }, [courseId, title, description, difficulty, price, isPublished, category, version]);

    // Track Mounted Status
    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    // 1. LOAD DATA
    useEffect(() => {
        setIsLoaded(false);
        setSaveStatus('saved');

        fetch(`/api/courses/${courseId}`)
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                if (isMountedRef.current) {
                    setTitle(data.nume_curs || "");
                    setDescription(data.descriere || "");
                    setDifficulty(data.dificultate || "usor");
                    setPrice(data.pret || "");
                    setThumbnail(data.thumbnail_url || "");
                    setIsPublished(Boolean(data.is_published));
                    setCategory(data.category || "General");
                    setVersion(data.version || 1);

                    // Reset dirty flag after load so we don't save immediately
                    isDirtyRef.current = false;
                    setIsLoaded(true);
                }
            })
            .catch(err => {
                if (isMountedRef.current) showAlert("Load failed: " + err.message, "error");
            });
    }, [courseId]);

    // 2. CORE SAVE FUNCTION
    // Designed to work even if the component is unmounting (fire-and-forget)
    const performSave = async (dataToSave, fileToUpload = null) => {
        if (!dataToSave || !dataToSave.id) return;

        const seq = ++saveSeqRef.current;

        // Cancel any in-flight save before starting a new one
        if (saveControllerRef.current) saveControllerRef.current.abort();
        const controller = new AbortController();
        saveControllerRef.current = controller;

        // Only update UI if mounted
        if (isMountedRef.current) setSaveStatus('saving');

        try {
            const formData = new FormData();
            formData.append('numeCurs', dataToSave.title);
            formData.append('descriere', dataToSave.description);
            formData.append('dificultate', dataToSave.difficulty);
            formData.append('pret', dataToSave.price);
            formData.append('isPublished', dataToSave.isPublished ? 1 : 0);
            formData.append('category', dataToSave.category);
            formData.append('version', dataToSave.version);

            if (fileToUpload) {
                formData.append('image', fileToUpload);
            }

            // CRITICAL: keepalive: true ensures the request finishes even if you close the tab
            const response = await fetch(`/api/courses/${dataToSave.id}`, {
                method: 'PATCH',
                body: formData,
                keepalive: true,
                signal: controller.signal
            });

            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                if (response.status === 409) {
                    showAlert("Content was updated elsewhere. Reloading...", "warning");

                    // Reload fresh data from server
                    const freshData = await fetch(`/api/courses/${dataToSave.id}`)
                        .then(r => r.json());

                    // Update local state with server data
                    setTitle(freshData.nume_curs || "");
                    setDescription(freshData.descriere || "");
                    setDifficulty(freshData.dificultate || "usor");
                    setPrice(freshData.pret || "");
                    setVersion(freshData.version);

                    setSaveStatus('error');
                    showAlert("Your changes were discarded. Please review and save again.", "error");
                    return;
                }

                throw new Error(errBody.error || "Save failed");
            }

            const resData = await response.json();
            if (seq !== saveSeqRef.current) return; // Ignore stale response

            // UI Updates
            if (isMountedRef.current) {
                if (resData.newImage) setThumbnail(resData.newImage);
                setSaveStatus('saved');
                setLastSaved(new Date());
                isDirtyRef.current = false;
                if (resData?.version) setVersion(resData.version);
            }
        } catch (error) {
            if (error?.name === 'AbortError') return; // Expected when superseded
            console.error("Save failed:", error);
            if (isMountedRef.current) {
                setSaveStatus('error');
            }
        }
    };

    // 3. FAILSAFE TRIGGERS

    // Trigger A: Debounce (Typing)
    useEffect(() => {
        if (!isLoaded) return;

        // Mark as dirty
        isDirtyRef.current = true;
        setSaveStatus('saving'); // UI feedback immediately

        const timer = setTimeout(() => {
            if (isDirtyRef.current) {
                performSave(dataRef.current);
            }
        }, 1500);

        // Cleanup: If user keeps typing, clear timer. 
        // NOTE: We do NOT save on simple cleanup here, we let the timer roll.
        // The unmount cleanup below handles the "leaving page" case.
        return () => clearTimeout(timer);
    }, [title, description, difficulty, price, category, isPublished]); // Run on any data change

    // Trigger B: Navigation / Unmount / ID Change
    // This runs when you leave the page or switch to a different course
    useEffect(() => {
        return () => {
            // If we have unsaved changes when leaving, SAVE IMMEDIATELY
            if (isDirtyRef.current) {
                console.log("Unmount detected, forcing save...");
                performSave(dataRef.current);
            }
        };
    }, []); // Empty dependency array = runs on mount/unmount ONLY

    // Trigger C: Tab Switch (Visibility Change)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && isDirtyRef.current) {
                console.log("Tab hidden, forcing save...");
                performSave(dataRef.current);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Trigger D: Close Tab / Refresh Browser
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirtyRef.current) {
                // Attempt a save
                performSave(dataRef.current);

                // Show browser confirmation
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // 4. FILE UPLOAD HANDLER
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setThumbnail(URL.createObjectURL(file));
            // Save immediately with file
            performSave(dataRef.current, file);
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