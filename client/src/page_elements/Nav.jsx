import React from "react";
import { NavLink } from "react-router";

export default function() {
  const linkArray = ["courses", "about", "login"];
  const linkText = ["explore course list", "learn more", "login"];
  const [isLogged, setIsLogged] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/profile")
    .then(res => res.json())
    .then(data => setIsLogged(data?.isLogged));
  }, []);  

  console.log(isLogged)

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
          >
            {linkText[index]}
          </NavLink>
        ))}
        <NavLink
         to="/profile" 
         className="nav-link"
         style={{display:isLogged ? "" : "none"}}
         >
        profile
      </NavLink>
      </div>
    </nav>
  );
}
