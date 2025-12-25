import React from "react";
import { useNavigate } from "react-router";
import { LoggedInContext } from "./LoggedInContext"; // Importă contextul existent

// Aici mutăm Alert, UserData, IsLogged din vechiul Dashboard
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function AuthProvider({ children }) {
    const [isLogged, setIsLogged] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true); // Default true la start
    const [userData, setUserData] = React.useState(null);

    const authNavigate = useNavigate();
    
    // Alert State
    const [alert, setAlert] = React.useState({
        open: false,
        message: '',
        severity: 'info'
    });

    // Alert helper
    const showAlert = (message, severity = 'info') => {
        setAlert({ open: true, message, severity });
    };

    const handleCloseAlert = (event, reason) => {
        if (reason === 'clickaway') return;
        setAlert({ ...alert, open: false });
    };

    // Check Login on mount
    React.useEffect(() => {
        setIsLoading(true);
        fetch("/api/profile")
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw { error: data.error };
                setIsLogged(true);
                setUserData(data);
            })
            .catch(err => {
                setIsLogged(false);
                setUserData(null);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    function logOut() {
        fetch("/api/logout", {
            method: 'POST',
            headers: { "Content-Type": "application/json" }
        })
        .then(res => res.json())
        .then(() => {
            setIsLogged(false);
            setUserData(null);
            authNavigate("/");

            showAlert("Logged out successfully", "success");
        })
        .catch(err => {
            console.error(err);
            showAlert("Eroare la delogare", "error");
        });
    }

    return (
        <LoggedInContext.Provider value={{ 
            isLogged, setIsLogged, 
            userData, setUserData, 
            logOut, 
            isLoading, setIsLoading,
            showAlert
        }}>
            {children}

            <Snackbar 
                open={alert.open} 
                autoHideDuration={6000} 
                onClose={handleCloseAlert}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseAlert} severity={alert.severity} variant="filled" sx={{ width: '100%' }}>
                    {alert.message}
                </Alert>
            </Snackbar>
        </LoggedInContext.Provider>
    );
}