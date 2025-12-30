import React from "react";
import { useNavigate } from "react-router";

// MUI Imports
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';

// Icons
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';

export default function About() {
    const navigate = useNavigate();

    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
            
            {/* 1. HERO SECTION */}
            <Box sx={{ textAlign: 'center', mb: 8 }}>
                <Typography component="h1" variant="h2" fontWeight="bold" gutterBottom color="#FF9F1C">
                    About Learnify
                </Typography>
                <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                    Empowering growth through knowledge.
                </Typography>
            </Box>

            {/* 2. MAIN STORY CARD */}
            <Paper elevation={3} sx={{ p: 4, mb: 8, borderRadius: 2 }}>
                <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                    Learnify is a modern online learning platform designed to make high-quality education accessible to everyone. 
                    Whether you're a student, professional, or lifelong learner, our goal is to help you master new skills efficiently.
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                    We believe learning should be practical, engaging, and community-driven. 
                    That's why we collaborate with passionate instructors and provide tools for interactive, hands-on education.
                </Typography>
            </Paper>

            {/* 3. CORE VALUES GRID */}
            <Grid container spacing={4} sx={{ mb: 8 }} justifyContent={"center "}>
                <ValueItem 
                    icon={<SchoolIcon fontSize="large" />} 
                    title="Accessible" 
                    description="High-quality education available to everyone, everywhere." 
                />
                <ValueItem 
                    icon={<GroupsIcon fontSize="large" />} 
                    title="Community" 
                    description="Learn alongside peers and passionate instructors." 
                />
                <ValueItem  
                    icon={<EmojiObjectsIcon  fontSize="large" />} 
                    title="Practical" 
                    description="Gain real-world skills through hands-on learning." 
                />
            </Grid>

            {/* 4. CALL TO ACTION */}
            <Box sx={{ textAlign: 'center', bgcolor: 'grey.100', p: 6, borderRadius: 2 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Start your journey today
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
                    Join us and take the first step toward expertise — one course at a time.
                </Typography>
                <Button 
                    variant="contained" 
                    size="large" 
                    onClick={() => navigate('/register')}
                    sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
                >
                    Join Learnify
                </Button>
            </Box>
        </Container>
    );
}

// Helper component for the 3 columns
function ValueItem({ icon, title, description }) {
    return (
        <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: '#FF9F1C', width: 60, height: 60, mx: 'auto', mb: 2 }}>
                {icon}
            </Avatar>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {description}
            </Typography>
        </Grid>
    );
}