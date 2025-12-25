import React, { useContext, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { LoggedInContext } from "./context/LoggedInContext";

// MUI Imports
import {
    Avatar,
    Button,
    CssBaseline,
    TextField,
    Link,
    Grid, 
    Box,
    Typography,
    Container,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Stack 
} from '@mui/material';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';

export default function Register() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    // ... (rest of your state: email, password, etc.)
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [retypePassword, setRetypePassword] = useState("");
    const [type, setType] = useState("student");

    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { showAlert } = useContext(LoggedInContext);
    const navigate = useNavigate();

    function sendRegister(e) {
        e.preventDefault();
        setErrorMessage("");

        if (!firstName || !lastName || !username || !email || !password || !retypePassword) {
            setErrorMessage("Please complete all required fields.");
            return; 
        }

        if (password !== retypePassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        const name = `${firstName} ${lastName}`

        setIsLoading(true);
        fetch("/api/register", {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password, type, name })
        })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw { error: data.error || "Something went wrong." };
                return data;
            })
            .then(() => {
                if (showAlert) {
                    showAlert("Verification link sent! Check your email.", "info");
                }
                navigate("/login");
            })
            .catch(err => {
                setErrorMessage(err.error || "Registration failed");
                setIsLoading(false);
            });
    }

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <Paper
                elevation={6}
                sx={{
                    marginTop: 8,
                    padding: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    <AppRegistrationIcon />
                </Avatar>

                <Typography component="h1" variant="h5">
                    Sign up
                </Typography>

                {errorMessage && (
                    <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                        {errorMessage}
                    </Alert>
                )}

                <Box component="form" noValidate onSubmit={sendRegister} sx={{ mt: 3, width: '100%' }}>
                    <Stack spacing={2}>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                name="firstName"
                                required
                                fullWidth
                                id="firstName"
                                label="First Name"
                                autoFocus
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                            <TextField
                                name="lastName"
                                required
                                fullWidth
                                id="lastName"
                                label="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </Stack>
                        {/* End of Split Row */}

                        <TextField
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />

                        <TextField
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <FormControl fullWidth>
                            <InputLabel id="role-select-label">Account Type</InputLabel>
                            <Select
                                labelId="role-select-label"
                                id="role-select"
                                value={type}
                                label="Account Type"
                                onChange={(e) => setType(e.target.value)}
                                required
                            >
                                <MenuItem value="student">Student</MenuItem>
                                <MenuItem value="professor">Professor</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <TextField
                            required
                            fullWidth
                            name="retypePassword"
                            label="Confirm Password"
                            type="password"
                            id="retypePassword"
                            value={retypePassword}
                            onChange={(e) => setRetypePassword(e.target.value)}
                            error={password !== retypePassword && retypePassword !== ""}
                            helperText={
                                password !== retypePassword && retypePassword !== ""
                                    ? "Passwords do not match"
                                    : ""
                            }
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={isLoading}
                        >
                            {isLoading ? "Registering..." : "Sign Up"}
                        </Button>

                        <Grid container justifyContent="center">
                            <Grid item>
                                <Link component={NavLink} to="/login" variant="body2" sx={{ textDecoration: 'none' }}>
                                    Already have an account? Sign in
                                </Link>
                            </Grid>
                        </Grid>
                    </Stack>
                </Box>
            </Paper>
        </Container>
    );
}