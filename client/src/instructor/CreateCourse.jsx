import React, { useState, useContext } from "react";
import { useNavigate } from "react-router";
import { LoggedInContext } from "../context/LoggedInContext"; // Adjust path if needed

// MUI Imports
import {
    Container,
    Paper,
    Typography,
    Box,
    TextField,
    MenuItem,
    Button,
    Stack,
    InputAdornment,
    Grid,
    IconButton
} from '@mui/material';

// Icons
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

export default function CreateCourse() {
    const navigate = useNavigate();
    const { showAlert } = useContext(LoggedInContext); // Use global alert system

    // 1. State Management
    const [formData, setFormData] = useState({
        numeCurs: "",
        desc: "",
        dificultate: "usor",
        pret: "",
        category: "General" // Adaugă
    });

    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 2. Handlers
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Image Validation & Setting
    const handleImageFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            showAlert("Please upload a valid image file (JPG, PNG).", "error");
        }
    };

    // Drag & Drop Handlers
    const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleImageFile(file);
    };

    const removeImage = (e) => {
        e.stopPropagation(); // Prevent clicking the dropzone when clicking X
        setImageFile(null);
        setPreviewUrl(null);
    };

    // Submission Logic
    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.numeCurs || !formData.desc || !formData.pret) {
            showAlert("Please fill in all required fields.", "warning");
            return;
        }

        setIsLoading(true);

        const data = new FormData();
        data.append("numeCurs", formData.numeCurs);
        data.append("descriere", formData.desc);
        data.append("dificultate", formData.dificultate);
        data.append("pret", formData.pret);
        data.append("category", formData.category);
        if (imageFile) data.append("image", imageFile);

        fetch("/api/courses", {
            method: "POST",
            body: data
        })
            .then(async res => {
                const responseData = await res.json();
                if (!res.ok) throw new Error(responseData.error || "Something went wrong");
                return responseData;
            })
            .then(() => {
                showAlert("Course created successfully!", "success");
                navigate("../my_courses"); // Or navigate to dashboard
            })
            .catch(err => {
                console.error(err);
                showAlert(err.message || "Failed to create course.", "error");
                setIsLoading(false);
            });
    };

    return (
        <Container maxWidth="sm" sx={{ py: 6 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                        Create New Course
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Fill in the details below to publish a new course.
                    </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Stack spacing={3}>

                        {/* Course Name */}
                        <TextField
                            label="Course Title"
                            name="numeCurs"
                            value={formData.numeCurs}
                            onChange={handleChange}
                            required
                            fullWidth
                            variant="outlined"
                        />

                        {/* Description (Multi-line) */}
                        <TextField
                            label="Description"
                            name="desc"
                            value={formData.desc}
                            onChange={handleChange}
                            required
                            fullWidth
                            multiline
                            rows={4}
                            variant="outlined"
                        />

                        <Grid container spacing={2}>
                            {/* Difficulty Select */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    label="Difficulty"
                                    name="dificultate"
                                    value={formData.dificultate}
                                    onChange={handleChange}
                                    fullWidth
                                >
                                    <MenuItem value="usor">Easy</MenuItem>
                                    <MenuItem value="mediu">Medium</MenuItem>
                                    <MenuItem value="greu">Hard</MenuItem>
                                </TextField>
                            </Grid>

                            {/* Price Input */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Price"
                                    name="pret"
                                    type="number"
                                    value={formData.pret}
                                    onChange={handleChange}
                                    fullWidth
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            select
                            label="Category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            fullWidth
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

                        {/* --- Custom Image Drop Zone --- */}
                        <Box
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            onClick={() => document.getElementById('file-upload').click()}
                            sx={{
                                border: '2px dashed',
                                borderColor: isDragging ? 'primary.main' : 'grey.400',
                                borderRadius: 2,
                                p: 4,
                                textAlign: 'center',
                                cursor: 'pointer',
                                bgcolor: isDragging ? 'action.hover' : 'background.paper',
                                transition: 'all 0.2s',
                                position: 'relative',
                                minHeight: 150,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <input
                                id="file-upload"
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        handleImageFile(e.target.files[0]);
                                    }
                                    e.target.value = "";
                                }}
                            />

                            {previewUrl ? (
                                // Preview State
                                <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
                                    <Box
                                        component="img"
                                        src={previewUrl}
                                        alt="Preview"
                                        sx={{ maxHeight: 200, maxWidth: '100%', borderRadius: 1, objectFit: 'cover' }}
                                    />
                                    <IconButton
                                        onClick={removeImage}
                                        sx={{
                                            position: 'absolute',
                                            top: -10,
                                            right: -10,
                                            bgcolor: 'background.paper',
                                            boxShadow: 2,
                                            '&:hover': { bgcolor: 'grey.200' }
                                        }}
                                        size="small"
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </Box>
                            ) : (
                                // Empty State
                                <>
                                    <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                    <Typography variant="h6" color="text.primary">
                                        Drag & Drop course thumbnail
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        or click to browse
                                    </Typography>
                                </>
                            )}
                        </Box>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={isLoading}
                            startIcon={<AddCircleOutlineIcon />}
                            sx={{ py: 1.5, mt: 2 }}
                        >
                            {isLoading ? "Creating..." : "Create Course"}
                        </Button>

                    </Stack>
                </Box>
            </Paper>
        </Container>
    );
}