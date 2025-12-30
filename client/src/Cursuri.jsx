import React, { useState, useEffect } from "react";
import CourseCard from "./CourseCard";
import { useContext } from "react";
import { LoggedInContext } from "./context/LoggedInContext";

// MUI Imports
import {
    Container, Grid, Typography, CircularProgress, Alert, Box, Divider,
    TextField, InputAdornment, Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { showAlert } = useContext(LoggedInContext);

    useEffect(() => {
        setLoading(true);
        
        // Build URL with search param if exists
        const url = searchQuery 
            ? `/api/courses?search=${encodeURIComponent(searchQuery)}`
            : `/api/courses`;

        fetch(url)
            .then(async res => {
                if (!res.ok) throw new Error("Could not load courses");
                return res.json();
            })
            .then(data => {
                setCourses(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                showAlert("Failed to load courses. Please try again later.", "error");
                setLoading(false);
            });
    }, [searchQuery]); // Re-fetch when searchQuery changes

    // Debounce helper to avoid too many API calls while typing
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4, minHeight: '60vh' }}>
            <Box sx={{ mb: 5, textAlign: 'center' }}>
                <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                    Explore Courses
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Discover new skills and advance your career
                </Typography>
                <Divider sx={{ mt: 2, maxWidth: 100, mx: 'auto', bgcolor: 'primary.main', borderBottomWidth: 3 }} />
            </Box>

            {/* Search Bar */}
            <Paper elevation={2} sx={{ p: 2, mb: 4, maxWidth: 600, mx: 'auto' }}>
                <TextField
                    fullWidth
                    placeholder="Search courses by name or description..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    variant="outlined"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Paper>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <CircularProgress size={60} thickness={4} />
                </Box>
            )}

            {!loading && (
                <>
                    {courses.length > 0 ? (
                        <>
                            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                                {searchQuery ? `Found ${courses.length} result(s) for "${searchQuery}"` : `${courses.length} courses available`}
                            </Typography>
                            <Grid container spacing={3}>
                                {courses.map((curs, index) => (
                                    <Grid item key={index} xs={12} sm={6} md={4}>
                                        <CourseCard curs={curs} />
                                    </Grid>
                                ))}
                            </Grid>
                        </>
                    ) : (
                        <Box sx={{ textAlign: 'center', mt: 5 }}>
                            <Typography variant="h6" color="text.secondary">
                                {searchQuery 
                                    ? `No courses found for "${searchQuery}"`
                                    : "No courses are currently available."
                                }
                            </Typography>
                        </Box>
                    )}
                </>
            )}
        </Container>
    );
}