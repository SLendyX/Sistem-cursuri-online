import React, { useState, useEffect } from "react";
import CourseCard from "./CourseCard";

// MUI Imports
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        // Note: Added "/" to start of path for reliability
        fetch("/api/courses")
            .then(async res => {
                if (!res.ok) {
                    throw new Error("Could not load courses");
                }
                return res.json();
            })
            .then(data => {
                // Ensure data is an array before setting
                setCourses(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setError("Failed to load available courses. Please try again later.");
                setLoading(false);
            });
    }, []);

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

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <CircularProgress size={60} thickness={4} />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mx: 'auto', maxWidth: 600 }}>
                    {error}
                </Alert>
            )}

            {!loading && !error && (
                <>
                    {courses.length > 0 ? (
                        <Grid container spacing={4}>
                            {courses.map((curs, index) => (
                                <Grid item key={index} xs={12} sm={6} md={4}>
                                    <CourseCard curs={curs} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        /* Empty State */
                        <Box sx={{ textAlign: 'center', mt: 5 }}>
                            <Typography variant="h6" color="text.secondary">
                                No courses are currently available.
                            </Typography>
                        </Box>
                    )}
                </>
            )}
        </Container>
    );
}