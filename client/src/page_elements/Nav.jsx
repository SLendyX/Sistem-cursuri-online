import React from "react";
import { NavLink } from "react-router";

export default function(){

    const linkArray = ["courses", "about", "login",]

    return(
        <nav>
            <NavLink 
                to={"/"}
            >
                home
            </NavLink>
            {linkArray.map((link, index) => {
                return (<NavLink
                    to={`/${link}`}
                    key={index}
                >
                    {link}
                </NavLink>)
            })}
            <NavLink 
                to={"/profile"}
            >
                profile
            </NavLink>
        </nav>
    )
}