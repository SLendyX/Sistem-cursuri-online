import React from "react";
import { NavLink } from "react-router";
import { LoggedContext } from "../context/LoggedContext";
import defaultImg from "../assets/default.jpg";
import { AppBar, Stack, Card, Container, Typography, Toolbar, Box, IconButton, Menu, MenuItem, Button, Tooltip, Avatar } from '@mui/material';
import AdbIcon from '@mui/icons-material/Adb';
import MenuIcon from '@mui/icons-material/Menu';

export default function() {
  const linkArray = ["courses", "about", "login"];
  const linkText = ["explore course list", "learn more", "login"];

  const pages = ['Products', 'Pricing', 'Blog'];
const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // const { isLogged, userData, logOut } = React.useContext(LoggedContext);

  return (
    <AppBar position="static"> {/* Added position static for standard flow */}
    <Container maxWidth="xl"> {/* REMOVE className="navbar" here */}
        <Toolbar className="navbar">
            <Typography className="nav-logo" variant="h4">
                Learnify
            </Typography>
            
            <Stack className="nav-links" direction="row"> 
                {linkArray.map((link, index) => (
                    <NavLink
                        to={`/${link}`}
                        key={index}
                        className="nav-link"
                        style={link === "login" ? {display: "none"} : {}}
                    >
                        {linkText[index]}
                    </NavLink>
                ))}
            </Stack>
        </Toolbar>
    </Container>
</AppBar>

    // <nav className="navbar">
    //   <header>
    //     <NavLink to="/" className="nav-logo">
    //       Learnify
    //     </NavLink>
    //   </header>

    //   <div className="nav-links">
    //     {linkArray.map((link, index) => (
    //       <NavLink
    //         to={`/${link}`}
    //         key={index}
    //         className="nav-link"
    //         style={link === "login" ? {display: isLogged ? "none" : ""} : {}}
    //       >
    //         {linkText[index]}
    //       </NavLink>
    //     ))}
        
    //     {isLogged && (
    //         <div className="nav-user-container">
    //             <div className="user-avatar-wrapper">
    //               <NavLink to="profile">
    //                 <img src={defaultImg} alt="User" className="nav-user-avatar" />
    //               </NavLink>
    //             </div>
                
    //             <div className="dropdown-menu">
    //                 <NavLink to="/profile" className="dropdown-item">Profile</NavLink>
    //                 <NavLink to="/" className="dropdown-item">My Courses</NavLink>
    //                 {userData?.type === 'professor' && (
    //                     <NavLink to="/create_course" className="dropdown-item">Create Course</NavLink>
    //                 )}
    //                 <button onClick={logOut} className="dropdown-item logout-link">Logout</button>
    //             </div>
    //         </div>
    //     )}
    //   </div>
    // </nav>
  );
}