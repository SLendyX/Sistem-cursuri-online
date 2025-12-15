import { useContext } from "react";
import { Navigate, Outlet } from "react-router";
import { LoggedInContext } from "./page_elements/LoggedInContext";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const PublicOnlyRoute = () => {
    const { isLogged, isLoading } = useContext(LoggedInContext);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isLogged) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default PublicOnlyRoute;