import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { LoggedInContext } from "./LoggedInContext";

// MUI Imports
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

// Components
import Footer from "./Footer";
import Nav from "./Nav";
import BackTopButton from "./BackTopButton";

export default function Dashboard() {
    const [isLogged, setIsLogged] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [userData, setUserData] = React.useState(null);
    
    // --- 1. NEW: Alert State ---
    const [alert, setAlert] = React.useState({
        open: false,
        message: '',
        severity: 'info' // 'success' | 'info' | 'warning' | 'error'
    });

    const location = useLocation();
    const navigate = useNavigate();

    // --- 2. NEW: Helper function to trigger alert ---
    const showAlert = (message, severity = 'info') => {
        setAlert({
            open: true,
            message,
            severity
        });
    };

    const handleCloseAlert = (event, reason) => {
        if (reason === 'clickaway') return;
        setAlert({ ...alert, open: false });
    };

    // --- Existing Logic ---
    React.useEffect(() => {
        setIsLoading(true);
        fetch("/api/profile")
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw { error: data.error };
                setIsLogged(true);
                setUserData(data);
                setIsLoading(false);
            })
            .catch(err => {
                // Optional: You could even alert here if session fetch fails hard
                setIsLogged(false);
                setUserData(null);
                setIsLoading(false);
            });
    }, []);

    function logOut() {
        fetch("/api/logout", {
            method: 'POST',
            headers: { "Content-Type": "application/json" }
        })
        .then(res => res.json())
        .then(data => {
            setIsLogged(false);
            setUserData(null);
            navigate("/");
            
            showAlert("Logged out successfully", "success");
        })
        .catch(err => {
            console.error(err);
            showAlert("Error logging out", "error");
        });
    }

    return (
        // --- 4. Pass 'showAlert' to context ---
        <LoggedInContext value={{ 
            isLogged, setIsLogged, 
            userData, setUserData, 
            logOut, 
            isLoading, setIsLoading,
            showAlert
        }}>
            <CssBaseline />
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
                <Nav />
                <Box component="main" sx={{ flexGrow: 1, py: 3, width: '100%', bgcolor:"background.default" }}>
                    <Container maxWidth="lg">
                        <Outlet />
                    </Container>
                </Box>
                <Footer />
                <BackTopButton /> 
            </Box>

            
            <Snackbar 
                open={alert.open} 
                autoHideDuration={6000} 
                onClose={handleCloseAlert}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }} // Position: Top Center
            >
                <Alert 
                    onClose={handleCloseAlert} 
                    severity={alert.severity} 
                    variant="filled" 
                    sx={{ width: '100%' }}
                >
                    {alert.message}
                </Alert>
            </Snackbar>

        </LoggedInContext>
    );
}