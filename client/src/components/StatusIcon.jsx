import React from "react";
import { Tooltip, CircularProgress } from "@mui/material";
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function StatusIcon({saveStatus}){
    switch (saveStatus) {
        // 🟡 Pending: You are typing, timer is running.
        case 'pending': 
            return (
                <Tooltip title="Waiting for you to stop typing...">
                    <CircularProgress size={15} thickness={5} sx={{ color: 'orange' }} />
                </Tooltip>
            );
            
        // 🔵 Saving: Data is flying to server.
        case 'saving': 
            return <CircularProgress size={20} color="primary" />;
            
        // 🟢 Saved: All good.
        case 'saved': 
            return <CloudDoneIcon color="success" />;
            
        // 🔴 Error
        case 'error': 
            return <ErrorOutlineIcon color="error" />;
            
        // 🟠 Conflict
        case 'conflict': 
            return <ErrorOutlineIcon color="warning" />;
            
        default: 
            return <CloudDoneIcon color="disabled" />;
    }
};