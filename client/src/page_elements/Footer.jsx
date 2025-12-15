import React from "react";
import { Box, Typography, Container } from '@mui/material';

export default function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                py: 3, // Padding top/bottom (3 * 8px = 24px)
                px: 2, // Padding left/right
                mt: 'auto', // Helps push footer to bottom if using flexbox
                backgroundColor: (theme) =>
                    theme.palette.mode === 'light'
                        ? theme.palette.grey[200]
                        : theme.palette.grey[800],
            }}
        >
            <Container maxWidth="sm">
                <Typography variant="body1" align="center">
                    © {new Date().getFullYear()} Learnify. All rights reserved.
                </Typography>
            </Container>
        </Box>
    );
}