// client/src/components/Breadcrumbs.jsx
import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';

export default function Breadcrumbs({ customItems = [] }) {
    const location = useLocation();

    // If custom items provided, use those
    if (customItems.length > 0) {
        return (
            <Box sx={{ py: 2 }}>
                <MuiBreadcrumbs
                    separator={<NavigateNextIcon fontSize="small" />}
                    aria-label="breadcrumb"
                >
                    <Link
                        component={RouterLink}
                        to="/"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color: 'text.primary',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                        }}
                    >
                        <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
                        Home
                    </Link>
                    {customItems.map((item, index) => {
                        const isLast = index === customItems.length - 1;
                        
                        if (isLast) {
                            return (
                                <Typography key={index} color="text.primary" fontWeight="bold">
                                    {item.label}
                                </Typography>
                            );
                        }

                        return (
                            <Link
                                key={index}
                                component={RouterLink}
                                to={item.path}
                                sx={{
                                    color: 'text.primary',
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' }
                                }}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </MuiBreadcrumbs>
            </Box>
        );
    }

    // Auto-generate from URL path
    const pathnames = location.pathname.split('/').filter((x) => x);

    // Skip breadcrumbs for home page
    if (pathnames.length === 0) return null;

    const breadcrumbNameMap = {
        'courses': 'Courses',
        'about': 'About',
        'profile': 'Profile',
        'my-learning': 'My Learning',
        'instructor': 'Instructor Panel',
        'create_course': 'Create Course',
        'my_courses': 'My Courses',
        'statistics': 'Statistics',
        'course': 'Course',
        'learn': 'Learn',
        'lesson': 'Lesson',
        'edit': 'Edit'
    };

    return (
        <Box sx={{ py: 2 }}>
            <MuiBreadcrumbs
                separator={<NavigateNextIcon fontSize="small" />}
                aria-label="breadcrumb"
            >
                <Link
                    component={RouterLink}
                    to="/"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: 'text.primary',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' }
                    }}
                >
                    <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
                    Home
                </Link>

                {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    
                    // Skip numeric IDs in breadcrumb display
                    if (!isNaN(value)) return null;

                    const label = breadcrumbNameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

                    return last ? (
                        <Typography key={to} color="text.primary" fontWeight="bold">
                            {label}
                        </Typography>
                    ) : (
                        <Link
                            key={to}
                            component={RouterLink}
                            to={to}
                            sx={{
                                color: 'text.primary',
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' }
                            }}
                        >
                            {label}
                        </Link>
                    );
                })}
            </MuiBreadcrumbs>
        </Box>
    );
}