import React from "react";
import { Outlet } from "react-router";
import Footer from "./Footer"
import Nav from "./Nav"
import BackTopButton from "./BackTopButton";
import { LoggedContext } from "../context/LoggedContext";
import { useLocation } from "react-router";

export default function(){
    const [isLogged, setIsLogged] = React.useState(false);
    const location = useLocation();
    
    return(
        <div className="site-page-container">
           
            <LoggedContext value={{isLogged, setIsLogged}}>
                <Nav/> 
                <p className="login-success-message"
                    style={{display: location.state?.fromLogin || location.state?.fromLogOut ? "block" : "none"}}
                >
                    {location.state?.fromLogin ? 
                        "You have logged in succesfully!" : 
                            location.state?.fromLogOut ? "You have logged out!" : ""}
                </p>
                <main className="main">
                    <Outlet />
                </main>
                <Footer />
                <BackTopButton />
            </LoggedContext>
        </div>
    )
}