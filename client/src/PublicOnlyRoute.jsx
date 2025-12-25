import { useContext } from "react";
import { Navigate, Outlet } from "react-router";
import { LoggedInContext } from "./context/LoggedInContext";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const PublicOnlyRoute = () => {
    const { isLogged, isLoading, userData } = useContext(LoggedInContext);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isLogged) {
        if (userData.type === "professor") {
            return <Navigate to="/instructor" replace />;
        } else {
            return <Navigate to="/" replace />;
        }

        
    }

    return <Outlet />;
};

export default PublicOnlyRoute;