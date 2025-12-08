import React from "react";
import { Outlet, useNavigate } from "react-router";
import Footer from "./Footer"
import Nav from "./Nav"
import BackTopButton from "./BackTopButton";
import { LoggedContext } from "../context/LoggedContext";
import { useLocation } from "react-router";
import LogingMessages from "./LogingMessages";

export default function(){
    const [isLogged, setIsLogged] = React.useState(false);
    const [hasRegistered, setHasRegistered] = React.useState(false)
    const [userData, setUserData] = React.useState(null)

    const location = useLocation();
    const navigate = useNavigate();

    React.useEffect(() => {
            fetch("/api/profile")
            .then(async (res) => {
                const data = await res.json()
                if(!res.ok)
                    throw{error: data.error}
                setIsLogged(true)
                setUserData(data)
            })
            .catch(err =>{
                console.error(err.error)
                setIsLogged(false)
                setUserData(null)
            })
    }, [isLogged]); // Re-fetch if login state changes

    function logOut(){
        fetch("/api/logout", {
                method: 'POST',
                headers: { "Content-Type": "application/json" }            
            })
        .then(res => res.json())
        .then(data => {
            setIsLogged(false)
            setUserData(null)
            localStorage.setItem("modalHidden", "false");
            navigate("/", {
                state: {
                    fromLogOut: true,
                    message:"Logged out succesfully"
                }
            })
        }).catch(err => {
            console.error("Error logging out:", err)
        })
    }

    return(
        <div className="site-page-container">
           
            <LoggedContext value={{isLogged, setIsLogged, hasRegistered, setHasRegistered, userData, setUserData, logOut}}>
                <Nav/> 
                <LogingMessages
                    changeFlag={(location.state?.fromLogin || location.state?.fromLogOut) ? isLogged : location.state?.fromRegister ? hasRegistered : null}
                    popUpType={location.state?.fromLogin? 0 : location.state?.fromLogOut ? 1 :  location.state?.fromRegister ? 1 : 2}
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