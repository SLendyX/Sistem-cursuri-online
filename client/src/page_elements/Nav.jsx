import React from "react";
import { NavLink } from "react-router";
import { LoggedContext } from "../context/LoggedContext";

export default function() {
  const linkArray = ["courses", "about", "login"];
  const linkText = ["explore course list", "learn more", "login"];

  const logged = React.useContext(LoggedContext) 

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
            style={link === "login" ? {display: logged.isLogged ? "none" : ""} : {}}
          >
            {linkText[index]}
          </NavLink>
        ))}
        <NavLink
         to="/profile" 
         className="nav-link"
         style={{display:logged.isLogged ? "" : "none"}}
         >
        profile
      </NavLink>
      </div>
    </nav>
  );
}
