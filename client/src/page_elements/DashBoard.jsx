import React from "react";
import { Outlet } from "react-router";
import Footer from "./Footer"
import Nav from "./Nav"
import BackTopButton from "./BackTopButton";
import { LoggedContext } from "../context/LoggedContext";
import { useLocation } from "react-router";
import LogingMessages from "./LogingMessages";

export default function(){
    const [isLogged, setIsLogged] = React.useState(false);
    const location = useLocation();

    return(
        <div className="site-page-container">
           
            <LoggedContext value={{isLogged, setIsLogged}}>
                <Nav/> 
                <LogingMessages
                    fromLogin={location.state?.fromLogin}
                    fromLogOut={location.state?.fromLogOut}
                />
                <main className="main">
                    <Outlet />
                </main>
                <Footer />
                <BackTopButton />
            </LoggedContext>
        </div>
    )
}