import React, { useEffect, useState } from "react";
import { Link } from "react-router"; // sau 'react-router-dom'

// MUI Imports
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility'; // Pentru vizualizare (optional)

export default function CreatedCourses() {
    // 1. Starea pentru date și încărcare
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 2. useEffect pentru a face fetch o singură dată
    useEffect(() => {
        fetch("/api/my_courses")
            .then(res => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.json();
            })
            .then(data => {
                setCourses(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Error fetching courses:", err);
                setIsLoading(false);
            });
    }, []); // [] gol înseamnă că rulează doar la montare (componentDidMount)

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (courses.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h6" color="text.secondary">
                    Nu ai creat niciun curs încă.
                </Typography>
                <Button variant="contained" sx={{ mt: 2 }} component={Link} to="/instructor/create_course">
                    Creează primul tău curs
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }} align="center">
                Cursurile Mele
            </Typography>

            <Grid container spacing={3} justifyContent="center">
                {courses.map((course) => (
                    <Grid item xs={12} sm={6} md={4} key={course.curs_id} width="50%">
                        <Card 
                            sx={{ 
                                height: '100%', 
                                display: 'flex', 
                                flexDirection: 'column',
                                transition: '0.3s',
                                '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
                            }}
                        >
                            {/* Imaginea Cursului */}
                            <CardMedia
                                component="img"
                                height="140"
                                image={course.thumbnail_url || "/images/default_course.jpg"} // Fallback image
                                alt={course.nume_curs}
                            />

                            <CardContent sx={{ flexGrow: 1 }}>
                                {/* Titlu și Status */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Typography variant="h6" component="div" sx={{ lineHeight: 1.2 }}>
                                        {course.nume_curs}
                                    </Typography>
                                    
                                    {/* Chip pentru Status (Publicat/Draft) */}
                                    <Chip 
                                        label={course.is_published === 1 ? "Publicat" : "Draft"} 
                                        color={course.is_published === 1 ? "success" : "default"}
                                        size="small"
                                        variant="outlined"
                                    />
                                </Box>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: '3em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {course.descriere}
                                </Typography>

                                <Typography variant="subtitle1" color="primary.main" fontWeight="bold">
                                    {course.pret > 0 ? `$${course.pret}` : "Gratuit"}
                                </Typography>
                            </CardContent>

                            {/* Butoane de Acțiune */}
                            <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                                <Button 
                                    variant="contained" 
                                    size="small" 
                                    startIcon={<EditIcon />}
                                    component={Link}
                                    to={`/instructor/course/${course.curs_id}/edit`} // Link către editor
                                    fullWidth
                                >
                                    Editează
                                </Button>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}