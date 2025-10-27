import React from "react";
import { Outlet } from "react-router";
import Footer from "./Footer"
import Nav from "./Nav"

export default function(){
    return(
        <div className="page">
            <Nav/> 
            <main className="main">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}