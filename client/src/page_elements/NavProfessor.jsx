import React, { useContext } from 'react';
import { NavLink, Link, useNavigate } from 'react-router'; // sau 'react-router-dom' in functie de versiune
import { LoggedInContext } from '../context/LoggedInContext'; // Asigură-te că calea e corectă către noul context

// MUI Components
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import SchoolIcon from '@mui/icons-material/School';
import { Stack, Divider } from '@mui/material';

export default function NavProfesor() {
    const { userData, logOut } = useContext(LoggedInContext);
    const navigate = useNavigate();

    // State pentru meniul de profil
    const [anchorElUser, setAnchorElUser] = React.useState(null);

    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleLogout = () => {
        handleCloseUserMenu();
        logOut();
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            {/* Folosim o culoare diferită (ex: 'primary' mai închis sau 'secondary') pentru a distinge modul profesor */}
            <AppBar position="static" className='nav-professor'> {/* Verde inchis pentru profesor, de exemplu */}
                <Toolbar className='navbar navbar-professor'>
                    {/* LOGO / TITLU */}
                    <Box component={Link} to="/instructor" sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} className="nav-logo-professor" color="inherit">
                        <SchoolIcon  />
                        <Typography
                            variant="h6"
                            noWrap
                            sx={{
                                mr: 2,
                                display: { xs: 'none', md: 'flex' },
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                letterSpacing: '.1rem',
                                color: 'inherit',
                                textDecoration: 'none',
                                flexGrow: 1
                            }}
                        >
                            PANOU INSTRUCTOR
                        </Typography>
                    </Box>

                    {/* LINK-URI DE NAVIGARE */}
                    <Stack
                        direction="row"
                        spacing={1}
                        divider={<Divider orientation="vertical" flexItem sx={{bgcolor:"white"}}/>}
                        className='nav-links'
                    >
                        <Button component={Link} to="statistics" className='nav-link'>
                            Statistici
                        </Button>
                        <Button component={Link} to="create_course" className='nav-link'>
                            Creează Curs
                        </Button>
                        <Box sx={{ flexGrow: 0 }}>
                            <Tooltip title="Setări profil">
                                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                    <Avatar alt={userData?.firstName} src="/static/images/avatar/2.jpg" />
                                </IconButton>
                            </Tooltip>
                            <Menu
                                sx={{ mt: '45px' }}
                                id="menu-appbar"
                                anchorEl={anchorElUser}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorElUser)}
                                onClose={handleCloseUserMenu}
                            >
                                <MenuItem onClick={handleCloseUserMenu}>
                                    <NavLink to="profile" className="dropdown-item">
                                        My Account
                                    </NavLink>
                                </MenuItem>
                                <MenuItem onClick={handleCloseUserMenu}>
                                    <NavLink to="my_courses" className="dropdown-item">
                                        My Courses
                                    </NavLink>
                                </MenuItem>
                                <MenuItem onClick={handleCloseUserMenu}>
                                    <NavLink to="/" className="dropdown-item">
                                        Modul Student
                                    </NavLink>
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    <Typography className="dropdown-item logout-link"
                                    >
                                        Log out
                                    </Typography>
                                </MenuItem>
                            </Menu>
                        </Box>
                    </Stack>


                    {/* BUTON SCHIMBARE MOD */}

                    {/* USER MENU / AVATAR */}
                </Toolbar>
            </AppBar>
        </Box>
    );
}