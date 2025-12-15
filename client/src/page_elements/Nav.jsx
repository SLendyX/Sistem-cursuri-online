import React from "react";
import { NavLink } from "react-router";
import { LoggedInContext } from "./LoggedInContext";
import { AppBar, Stack, Divider, Container, Skeleton, Typography, Toolbar, IconButton, Menu, MenuItem } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';

export default function () {
  const linkArray = ["courses", "about", "login"];
  const linkText = ["explore course list", "learn more", "login"];

  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const { isLogged, userData, logOut, isLoading } = React.useContext(LoggedInContext);

  return (
    <>
      <div id="back-to-top-anchor" />
      <AppBar
        position="static"
        color="transparent"
        className="navbar-container">
        <Container maxWidth={false}  >
          <Toolbar className="navbar">
            <NavLink to="/" className="nav-logo">
              <Typography variant="h4">
                Learnify
              </Typography>
            </NavLink>

            <Stack
              className="nav-links"
              direction="row"
              spacing={1}
              divider={<Divider orientation="vertical" flexItem />}
            >
              {linkArray.map((link, index) => {
                if (link === "login" && isLogged) return null;

                return (
                  <NavLink
                    to={`/${link}`}
                    key={index}
                    className="nav-link"
                  >
                    {linkText[index]}
                  </NavLink>
                );
              })}

              {isLoading && isLogged ?
                <Skeleton variant="circular" width={40} height={40} animation="wave" />
                :
                isLogged ? (
                  <div>
                    <IconButton
                      size="large"
                      aria-label="account of current user"
                      aria-controls="menu-appbar"
                      aria-haspopup="true"
                      onClick={handleOpenUserMenu}
                      color="inherit"
                    >
                      <AccountCircle />
                    </IconButton>
                    <Menu
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
                        <NavLink to="/profile" className="dropdown-item"
                        >
                          My Account
                        </NavLink>
                      </MenuItem>

                      <MenuItem onClick={handleCloseUserMenu}>
                        <NavLink to="/" className="dropdown-item">
                          My Courses
                        </NavLink>
                      </MenuItem>

                      {userData?.type === 'professor' && (
                        <MenuItem onClick={handleCloseUserMenu}>
                          <NavLink to="/create_course" className="dropdown-item">
                            Create Course
                          </NavLink>

                        </MenuItem>
                      )}

                      <MenuItem onClick={handleCloseUserMenu}>
                        <button onClick={logOut} className="dropdown-item 
                          logout-link">
                          Logout
                        </button>
                      </MenuItem>
                    </Menu>
                  </div>
                ) : null
              }

            </Stack>
          </Toolbar>
        </Container>
      </AppBar>
    </>

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