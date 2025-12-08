import React from "react";
import { NavLink } from "react-router";
import { LoggedContext } from "../context/LoggedContext";
import defaultImg from "../assets/default.jpg";

export default function() {
  const linkArray = ["courses", "about", "login"];
  const linkText = ["explore course list", "learn more", "login"];

  const { isLogged, userData, logOut } = React.useContext(LoggedContext);

  return (
    <nav className="navbar">
      <header>
        <NavLink to="/" className="nav-logo">
          Learnify
        </NavLink>
      </header>

      <div className="nav-links">
        {linkArray.map((link, index) => (
          <NavLink
            to={`/${link}`}
            key={index}
            className="nav-link"
            style={link === "login" ? {display: isLogged ? "none" : ""} : {}}
          >
            {linkText[index]}
          </NavLink>
        ))}
        
        {isLogged && (
            <div className="nav-user-container">
                <div className="user-avatar-wrapper">
                  <NavLink to="profile">
                    <img src={defaultImg} alt="User" className="nav-user-avatar" />
                  </NavLink>
                </div>
                
                <div className="dropdown-menu">
                    <NavLink to="/profile" className="dropdown-item">Profile</NavLink>
                    <NavLink to="/" className="dropdown-item">My Courses</NavLink>
                    {userData?.type === 'professor' && (
                        <NavLink to="/create_course" className="dropdown-item">Create Course</NavLink>
                    )}
                    <button onClick={logOut} className="dropdown-item logout-link">Logout</button>
                </div>
            </div>
        )}
      </div>
    </nav>
  );
}