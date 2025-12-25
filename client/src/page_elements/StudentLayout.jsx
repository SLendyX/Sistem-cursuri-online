import React from "react";
import { Outlet } from "react-router";
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';

import Footer from "./Footer";
import Nav from "./NavStudent";
import BackTopButton from "./BackTopButton";

export default function StudentLayout() {
    return (
        <>
            <CssBaseline />
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
                <Nav /> {/* Navigatia standard */}
                <Box component="main" className="main-content" sx={{ flexGrow: 1, py: 3, width: '100%', bgcolor:"background.default" }}>
                    <Container maxWidth="lg">
                        <Outlet />
                    </Container>
                </Box>
                <Footer />
                <BackTopButton /> 
            </Box>
        </>
    );
}