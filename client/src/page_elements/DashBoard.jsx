import React from "react";
import { Outlet } from "react-router";
import Footer from "./Footer"
import Nav from "./Nav"
import BackTopButton from "./BackTopButton";
import { LoggedContext } from "../context/LoggedContext";

export default function(){
    const [isLogged, setIsLogged] = React.useState(false);


    return(
        <div className="site-page-container">
            <LoggedContext value={{isLogged, setIsLogged}}>
                <Nav/> 
                <main className="main">
                    <Outlet />
                </main>
                <Footer />
                <BackTopButton />
            </LoggedContext>
        </div>
    )
}