import React from "react";
import { Outlet } from "react-router";
import Footer from "./Footer"
import Nav from "./Nav"

export default function(){
    return(
        <>
            <Nav/> 
            <Outlet />
            <Footer />
        </>
    )
}