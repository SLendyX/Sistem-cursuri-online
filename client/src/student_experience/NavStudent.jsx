import React from "react";
import { NavLink, Link } from "react-router";
import { LoggedInContext } from "../context/LoggedInContext";
import { AppBar, Button, Stack, Divider, Container, Skeleton, Typography, Toolbar, IconButton, Menu, MenuItem } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import NavSkeleton from "../components/NavSkeleton";

export default function () {
  const linkArray = ["courses", "about", "login"];
  const linkText = ["explore courses", "about", "login"];

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
        <Container maxWidth={false}>
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
              {isLoading ? <NavSkeleton /> : linkArray.map((link, index) => {
                if (link === "login" && isLogged) return null;

                return (
                  <Button component={Link} to={`/${link}`} key={index}
                    className="nav-link">
                    {linkText[index]}
                  </Button>
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
                        <NavLink to={`${userData?.type === 'professor' ? "/instructor" : ""}/profile`} className="dropdown-item">
                          My Account
                        </NavLink>
                      </MenuItem>

                      {/* UPDATED - Now links to /my-learning for students */}
                      <MenuItem onClick={handleCloseUserMenu}>
                        <NavLink 
                          to={userData?.type === 'professor' ? "/instructor/my_courses" : "/my-learning"} 
                          className="dropdown-item"
                        >
                          My Courses
                        </NavLink>
                      </MenuItem>

                      {userData?.type === 'professor' && (
                        <MenuItem onClick={handleCloseUserMenu}>
                          <NavLink to="/instructor" className="dropdown-item">
                            Instructor Panel
                          </NavLink>
                        </MenuItem>
                      )}

                      <MenuItem onClick={handleCloseUserMenu}>
                        <button onClick={logOut} className="dropdown-item logout-link">
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
  );
}