import React from "react";
import { Outlet } from "react-router";
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';

import Footer from "./Footer";
import Nav from "./NavStudent";
import BackTopButton from "./BackTopButton";

export default function StudentLayout() {
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
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <Outlet />
                </Box>

                <Footer />
                <BackTopButton />
            </Box>
        </>
    );
}