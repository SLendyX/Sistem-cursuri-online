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


    React.useEffect(() => {
            fetch("/api/profile")
            .then(async (res) => {
                const data = await res.json()
                if(!res.ok)
                    throw{error: data.error}
                setIsLogged(true)
            })
            .catch(err =>{
                console.error(err.error)
            })
    }, []);

    return(
        <div className="site-page-container">
           
            <LoggedContext value={{isLogged, setIsLogged}}>
                <Nav/> 
                <LogingMessages
                    changeFlag={(location.state?.fromLogin || location.state?.fromLogOut) ? isLogged : }
                    popUpType={location.state?.fromLogin? 0 : location.state?.fromLogOut ? 1 :  1}
                >
                    {location.state?.message}
                </LogingMessages>
                <main className="main">
                    <Outlet />
                </main>
                <Footer />
                <BackTopButton />
            </LoggedContext>
        </div>
    )
}