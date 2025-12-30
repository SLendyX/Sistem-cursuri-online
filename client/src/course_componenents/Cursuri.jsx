// client/src/Cursuri.jsx
import React, { useState, useEffect, useContext } from "react";
import CourseCard from "./CourseCard";
import { LoggedInContext } from "../context/LoggedInContext";

import {
    Container, Grid, Typography, CircularProgress, Box, Divider,
    TextField, InputAdornment, Paper, Select, MenuItem, FormControl,
    InputLabel, Stack, Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import CategoryIcon from '@mui/icons-material/Category';

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const { showAlert } = useContext(LoggedInContext);

    // Fetch categories on mount
    useEffect(() => {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error("Failed to load categories:", err));
    }, []);

    // Fetch courses whenever filters change
    useEffect(() => {
        setLoading(true);
        
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (sortBy) params.append('sortBy', sortBy);
        if (selectedCategory !== 'All') params.append('category', selectedCategory);

        fetch(`/api/courses?${params.toString()}`)
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
    }, [searchQuery, sortBy, selectedCategory]);

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

            {/* Category Chips Filter */}
            <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Chip
                    label="All"
                    onClick={() => setSelectedCategory("All")}
                    color={selectedCategory === "All" ? "primary" : "default"}
                    variant={selectedCategory === "All" ? "filled" : "outlined"}
                />
                {categories.map((cat) => (
                    <Chip
                        key={cat.category}
                        label={`${cat.category} (${cat.count})`}
                        onClick={() => setSelectedCategory(cat.category)}
                        color={selectedCategory === cat.category ? "primary" : "default"}
                        variant={selectedCategory === cat.category ? "filled" : "outlined"}
                    />
                ))}
            </Box>

            {/* Search & Sort Bar */}
            <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        fullWidth
                        placeholder="Search courses by name, description, or instructor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        variant="outlined"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                        <InputLabel id="sort-label">Sort By</InputLabel>
                        <Select
                            labelId="sort-label"
                            value={sortBy}
                            label="Sort By"
                            onChange={(e) => setSortBy(e.target.value)}
                            startAdornment={<SortIcon sx={{ ml: 1, mr: -0.5, color: 'action.active' }} />}
                        >
                            <MenuItem value="newest">Newest First</MenuItem>
                            <MenuItem value="popularity">Most Popular</MenuItem>
                            <MenuItem value="rating">Highest Rated</MenuItem>
                            <MenuItem value="price_asc">Price: Low to High</MenuItem>
                            <MenuItem value="price_desc">Price: High to Low</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
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
                                {searchQuery 
                                    ? `Found ${courses.length} result(s) for "${searchQuery}"` 
                                    : selectedCategory !== 'All'
                                    ? `${courses.length} courses in ${selectedCategory}`
                                    : `${courses.length} courses available`
                                }
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
                                    : selectedCategory !== 'All'
                                    ? `No courses available in ${selectedCategory}`
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