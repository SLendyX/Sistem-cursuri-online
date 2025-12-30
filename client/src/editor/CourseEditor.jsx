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
    const [selectedFile, setSelectedFile] = useState(null);

    // UI States
    const [saveStatus, setSaveStatus] = useState('saved');
    const [lastSaved, setLastSaved] = useState(null);

    // Delete Dialog States
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const dataRef = useRef({ id: courseId, title, description, difficulty, price, isPublished });
    const isDirtyRef = useRef(false);

    useEffect(() => {
        dataRef.current = { id: courseId, title, description, difficulty, price, isPublished, category };
    }, [title, description, difficulty, price, courseId, isPublished, category]);

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
                    setIsPublished(Boolean(data.is_published));
                    setCategory(data.category || "General");
                    isDirtyRef.current = false;
                    setSaveStatus('saved');
                }
            })
            .catch(err => showAlert("Load failed: " + err.message, "error"));

        return () => { isMounted = false; };
    }, [courseId]);

    // 2. SAVE FUNCTION
    const saveCourse = useCallback(async (data, fileToUpload) => {
        setSaveStatus('saving');
        const minDelay = new Promise(resolve => setTimeout(resolve, 800));

        try {
            const formData = new FormData();
            formData.append('numeCurs', data.title);
            formData.append('descriere', data.description);
            formData.append('dificultate', data.difficulty);
            formData.append('pret', data.price);
            formData.append('isPublished', isPublished ? 1 : 0);
            formData.append('category', data.category);

            if (fileToUpload) {
                formData.append('image', fileToUpload);
            }

            const fetchPromise = fetch(`/api/courses/${data.id}`, {
                method: 'PATCH',
                body: formData,
                keepalive: true
            });

            const [response] = await Promise.all([fetchPromise, minDelay]);

            if (!response.ok) throw new Error("Save failed");

            const resData = await response.json();
            if (resData.newImage) setThumbnail(resData.newImage);

            setSaveStatus('saved');
            setLastSaved(new Date());
            isDirtyRef.current = false;
            setSelectedFile(null);

        } catch (error) {
            console.error("Auto-save failed:", error);
            setSaveStatus('error');
            showAlert("Failed to save changes", "error");
        }
    }, [isPublished]);

    // 3. AUTO-SAVE
    useEffect(() => {
        if (!title && !isDirtyRef.current) return;
        isDirtyRef.current = true;

        const dataToSave = { id: courseId, title, description, difficulty, price, category };
        const timer = setTimeout(() => saveCourse(dataToSave, null), 1500);

        return () => clearTimeout(timer);
    }, [title, description, difficulty, price, category, courseId, saveCourse, isPublished]);

    // 4. FILE UPLOAD
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setThumbnail(URL.createObjectURL(file));
            setSelectedFile(file);
            saveCourse(dataRef.current, file);
        }
    };

    // 5. DELETE COURSE
    const handleDeleteCourse = async () => {
        if (deleteConfirmText !== title) {
            showAlert("Course name doesn't match. Please type it exactly.", "warning");
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/courses/${courseId}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.hasStudents) {
                    showAlert(data.error, "warning");
                } else {
                    throw new Error(data.error);
                }
                setIsDeleting(false);
                return;
            }

            showAlert("Course deleted successfully", "success");
            navigate('/instructor/my_courses');

        } catch (err) {
            console.error(err);
            showAlert(err.message || "Failed to delete course", "error");
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
            <Breadcrumbs
                customItems={[
                    { label: 'Instructor Panel', path: '/instructor' },
                    { label: 'My Courses', path: '/instructor/my_courses' },
                    { label: title || 'Edit Course', path: '' }
                ]}
            />
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

                    <TextField
                        select
                        label="Category"
                        fullWidth
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
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

            {/* Danger Zone */}
            <Paper sx={{ p: 3, borderColor: 'error.main', border: 2 }}>
                <Typography variant="h6" color="error" gutterBottom>
                    Danger Zone
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Once you delete a course, there is no going back. Please be certain.
                </Typography>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteForeverIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                >
                    Delete Course
                </Button>
            </Paper>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => !isDeleting && setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ color: 'error.main' }}>
                    Delete Course: {title}
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        This action cannot be undone. All chapters, lessons, and resources will be permanently deleted.
                    </Alert>
                    <DialogContentText sx={{ mb: 2 }}>
                        To confirm deletion, please type the exact course name below:
                    </DialogContentText>
                    <TextField
                        autoFocus
                        fullWidth
                        variant="outlined"
                        placeholder={title}
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        disabled={isDeleting}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteCourse}
                        color="error"
                        variant="contained"
                        disabled={isDeleting || deleteConfirmText !== title}
                    >
                        {isDeleting ? "Deleting..." : "Delete Forever"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}