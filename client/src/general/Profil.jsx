// client/src/Profil.jsx
import React, { useContext, useEffect, useState } from "react";
import { LoggedInContext } from "../context/LoggedInContext";
import { useNavigate } from "react-router";

// MUI Imports
import { 
  Box, Container, Paper, Typography, TextField, Button, Stack, Alert,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SaveIcon from '@mui/icons-material/Save';

export default function Profile() {
    const navigate = useNavigate();
    const { logOut, isLoading, showAlert, setUserData } = useContext(LoggedInContext);

    const [profileDetails, setProfileDetails] = useState(null);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetch("/api/profile")
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw { error: data.error || "Something went wrong." };
                setProfileDetails(data);
                setEditedName(data.name || "");
            })
            .catch(err => {
                setError(err.error || "Failed to load profile");
            });
    }, []);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/users/profile", {
                method: 'PATCH',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editedName })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setProfileDetails({ ...profileDetails, name: editedName });
            setUserData(prev => ({ ...prev, name: editedName }));
            setIsEditing(false);
            showAlert("Profile updated successfully!", "success");
        } catch (err) {
            showAlert(err.message || "Failed to update profile", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== profileDetails?.username) {
            showAlert("Username doesn't match. Please type it exactly.", "warning");
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch("/api/users/profile", {
                method: 'DELETE'
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            showAlert("Account deleted. Goodbye!", "info");
            logOut();
            navigate("/");
        } catch (err) {
            showAlert(err.message || "Failed to delete account", "error");
            setIsDeleting(false);
        }
    };

    const renderProfileFields = () => {
        if (!profileDetails) return null;

        return (
            <Stack spacing={2}>
                <TextField
                    label="Username"
                    value={profileDetails.username}
                    variant="outlined"
                    fullWidth
                    InputProps={{ readOnly: true }}
                    disabled
                />

                <TextField
                    label="Email"
                    value={profileDetails.email}
                    variant="outlined"
                    fullWidth
                    InputProps={{ readOnly: true }}
                    disabled
                />

                <TextField
                    label="Full Name"
                    value={isEditing ? editedName : profileDetails.name}
                    onChange={(e) => setEditedName(e.target.value)}
                    variant="outlined"
                    fullWidth
                    InputProps={{ 
                        readOnly: !isEditing,
                        endAdornment: !isEditing && (
                            <Button 
                                size="small" 
                                onClick={() => setIsEditing(true)}
                                startIcon={<EditIcon />}
                            >
                                Edit
                            </Button>
                        )
                    }}
                />

                {isEditing && (
                    <Stack direction="row" spacing={2}>
                        <Button 
                            variant="contained" 
                            onClick={handleSaveProfile}
                            disabled={isSaving || editedName === profileDetails.name}
                            startIcon={<SaveIcon />}
                            fullWidth
                        >
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={() => {
                                setIsEditing(false);
                                setEditedName(profileDetails.name);
                            }}
                            disabled={isSaving}
                            fullWidth
                        >
                            Cancel
                        </Button>
                    </Stack>
                )}

                <TextField
                    label="Account Type"
                    value={profileDetails.type}
                    variant="outlined"
                    fullWidth
                    InputProps={{ readOnly: true }}
                    disabled
                />

                <TextField
                    label="Email Verified"
                    value={profileDetails.email_verified ? "Yes" : "No"}
                    variant="outlined"
                    fullWidth
                    InputProps={{ readOnly: true }}
                    disabled
                />
            </Stack>
        );
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" align="center" gutterBottom>
                    User Profile
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ mt: 2 }}>
                    {isLoading ? (
                        <Stack spacing={2}>
                            {/* Skeleton loaders */}
                        </Stack>
                    ) : renderProfileFields()}
                </Box>

                {/* LOGOUT BUTTON */}
                <Box sx={{ mt: 4 }}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        fullWidth 
                        size="large"
                        onClick={logOut}
                        disabled={isLoading}
                    >
                        Log Out
                    </Button>
                </Box>

                {/* DANGER ZONE */}
                <Box sx={{ mt: 6 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="h6" color="error" gutterBottom>
                        Danger Zone
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Once you delete your account, there is no going back. All your data will be permanently removed.
                    </Typography>
                    <Button 
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteForeverIcon />}
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        Delete Account
                    </Button>
                </Box>
            </Paper>

            {/* Delete Confirmation Dialog */}
            <Dialog 
                open={deleteDialogOpen} 
                onClose={() => !isDeleting && setDeleteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ color: 'error.main' }}>
                    Delete Account: {profileDetails?.username}
                </DialogTitle>
                <DialogContent>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        This action cannot be undone. All your courses, progress, and personal data will be permanently deleted.
                    </Alert>
                    <DialogContentText sx={{ mb: 2 }}>
                        To confirm deletion, please type your username below:
                    </DialogContentText>
                    <TextField
                        autoFocus
                        fullWidth
                        variant="outlined"
                        placeholder={profileDetails?.username}
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        disabled={isDeleting}
                    />
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setDeleteDialogOpen(false)} 
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteAccount} 
                        color="error" 
                        variant="contained"
                        disabled={isDeleting || deleteConfirmText !== profileDetails?.username}
                    >
                        {isDeleting ? "Deleting..." : "Delete Forever"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}