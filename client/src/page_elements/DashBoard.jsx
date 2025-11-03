import React from "react";
import { Outlet } from "react-router";
import Footer from "./Footer"
import Nav from "./Nav"
import BackTopButton from "./BackTopButton";

export default function(){
    return(
        <div className="site-page-container">
            <Nav/> 
            <main className="main">
                <Outlet />
            </main>
            <Footer />
            <BackTopButton />
        </div>
    )
}