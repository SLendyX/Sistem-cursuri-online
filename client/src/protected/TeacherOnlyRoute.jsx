import { useContext, useEffect } from "react"; // Importă useEffect
import { Navigate, Outlet } from "react-router";
import { LoggedInContext } from "../context/LoggedInContext"
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const TeacherOnlyRoute = () => {
    const { userData, isLoading, showAlert } = useContext(LoggedInContext);

    // Folosim useEffect pentru a afișa alerta (side effect)
    useEffect(() => {
        if (!isLoading && userData && userData?.type !== "professor") {
            showAlert("Doar profesorii pot accesa această pagină", "error");
        }
    }, [isLoading, userData, showAlert]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (userData?.type !== "professor") {
        // Aici facem doar redirectul, alerta e gestionată de useEffect
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default TeacherOnlyRoute;