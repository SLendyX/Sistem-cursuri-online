import { useContext } from "react";
import { Navigate, Outlet } from "react-router";
import { LoggedInContext } from "./page_elements/LoggedInContext";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const TeacherOnlyRoute = () => {
    const { userData, isLoading, showAlert } = useContext(LoggedInContext);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (userData.type !== "professor") {
        showAlert("Only teachers are allowed to create courses", "error")
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default TeacherOnlyRoute;