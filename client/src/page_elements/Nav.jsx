import React from "react";
import { NavLink } from "react-router";

export default function() {
  const linkArray = ["courses", "about", "login"];

  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-logo">
        home
      </NavLink>

      <div className="nav-links">
        {linkArray.map((link, index) => (
          <NavLink
            to={`/${link}`}
            key={index}
            className="nav-link"
          >
            {link}
          </NavLink>
        ))}
      </div>

      <NavLink to="/profile" className="nav-profile">
        profile
      </NavLink>
    </nav>
  );
}
