import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { LoggedInContext } from "../context/LoggedInContext";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const RequireAuth = () => {
    const { isLogged, isLoading } = useContext(LoggedInContext);
    const location = useLocation();

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isLogged) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}

export default RequireAuth;