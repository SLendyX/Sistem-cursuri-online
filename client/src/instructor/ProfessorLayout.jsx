import React from "react";
import { Outlet } from "react-router";
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Nav from "./NavProfessor";
import Footer from "../components/Footer";

export default function ProfessorLayout() {
    return (
        <>
            <CssBaseline />
            <Box 
                sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    minHeight: '100vh',
                    bgcolor: 'background.default' 
                }}
            >
                <Nav />

                <Box 
                    component="main" 
                    sx={{ 
                        flexGrow: 1,
                        py: 3,
                        px: 2
                    }}
                >
                    <Container maxWidth="xl">
                        <Outlet />
                    </Container>
                </Box>

                <Footer />
            </Box>
        </>
    );
}