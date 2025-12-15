import React from 'react';
import { NavLink, useNavigate } from "react-router"; // or "react-router-dom" depending on your version
import { LoggedInContext } from './page_elements/LoggedInContext';

// MUI Imports
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid'; // Use Grid2 if on MUI v6, but Grid v5 is standard
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';

export default function(){
    const [username, setUsername] = React.useState("")
    const [password, setPassword] = React.useState("")

    const redirectLogIn = useNavigate()
    const { setIsLogged, showAlert, setUserData } = React.useContext(LoggedInContext)

    function login(e) {
        e.preventDefault();

        fetch("/api/login", {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        }).then( async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.err)

            return fetch('/api/profile');
        })
        .then(async res => {
            const profileData = await res.json();

            if (!res.ok) throw new Error("Failed to load profile");

            setIsLogged(true);
            setUserData(profileData);
            if (showAlert) showAlert("Welcome back!", "success");
        })
        .catch(err => {
            showAlert(err.message || "Login failed", "error");
        });
    }


    return(
        <Container component="main" maxWidth="xs">
            <Paper 
                elevation={6} 
                sx={{
                    marginTop: 8,
                    padding: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: 2
                }}
            >
                {/* 1. Icon Header */}
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    <LockOutlinedIcon />
                </Avatar>
                
                <Typography component="h1" variant="h5">
                    Sign in
                </Typography>

                {/* 2. The Form */}
                <Box component="form" onSubmit={login} noValidate sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username or Email"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem' }}
                    >
                        Sign In
                    </Button>

                    {/* 3. Footer Links */}
                    <Grid container justifyContent="center">
                        <Grid item>
                            <Link component={NavLink} to="/register" variant="body2" sx={{textDecoration: 'none'}}>
                                {"Don't have an account? Register here"}
                            </Link>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    )
}