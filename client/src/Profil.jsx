import React, { useContext, useEffect, useState } from "react";
import { LoggedInContext } from "./page_elements/LoggedInContext";
import { useNavigate } from "react-router";

// MUI Imports
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Skeleton, 
  Stack, 
  Alert,
  Checkbox,
  FormControlLabel
} from '@mui/material';

export default function Profile() {
    const navigate = useNavigate();
    const { logOut, isLoading } = useContext(LoggedInContext);

    const [profileDetails, setProfileDetails] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch("/api/profile")
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw { error: data.error || "Something went wrong." };
                setProfileDetails(data);
            })
            .catch(err => {
                setError(err.error || "Failed to load profile");
            });
    }, []);

    const renderSkeletons = () => (
        <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={80} height={80} />
            </Box>
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
        </Stack>
    );

    const renderProfileFields = () => {
        if (!profileDetails) return null;

        return (
            <Stack spacing={2}>
                {Object.keys(profileDetails).map((key) => {
                    if (["userId", "isLogged", "error"].includes(key)) return null;


                    if (typeof profileDetails[key] === "boolean" || key === "email_verified") {
                        return (
                            <FormControlLabel
                                key={key}
                                control={<Checkbox checked={!!profileDetails[key]} disabled />}
                                label={key.replace('_', ' ')} 
                                sx={{ textTransform: 'capitalize' }}
                            />
                        );
                    }

                    // Handle Text Fields
                    return (
                        <TextField
                            key={key}
                            label={key.replace('_', ' ')}
                            defaultValue={profileDetails[key]}
                            variant="outlined"
                            fullWidth
                            InputProps={{
                                readOnly: true, 
                            }}
                            sx={{ textTransform: 'capitalize' }}
                        />
                    );
                })}
            </Stack>
        );
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" align="center" gutterBottom>
                    User Profile
                </Typography>

                {/* ERROR ALERT */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* MAIN CONTENT */}
                <Box sx={{ mt: 2 }}>
                    {isLoading ? renderSkeletons() : renderProfileFields()}
                </Box>

                {/* LOGOUT BUTTON */}
                <Box sx={{ mt: 4 }}>
                    <Button 
                        variant="contained" 
                        color="error" 
                        fullWidth 
                        size="large"
                        onClick={logOut}
                        disabled={isLoading}
                    >
                        Log Out
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}