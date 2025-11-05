import React, { useContext } from "react";
import { LoggedContext } from "./context/LoggedContext";
import { useNavigate } from "react-router";

export default function(){
    const [profileDetails, setProfileDetails] = React.useState({})
    const profileDetailsElements = []

    const navigate = useNavigate();

    const logged = useContext(LoggedContext)

    React.useEffect(() => {
        fetch("/api/profile")
        .then(async res => {
            const data = await res.json(); // parse JSON response

            if (!res.ok) {
                throw { error: data.error || "Something went wrong." };
            }

            return data;
        })
        .then(data => {
            setProfileDetails(data)
        }
    )
        .catch(err => setProfileDetails(err.error))
    }, []);

    function logOut(){
        fetch("/api/logout", {
                method: 'POST',
                headers: { "Content-Type": "application/json" }            
            })
        .then(res => res.json())
        .then(data => {
            logged.setIsLogged(false)
            setProfileDetails({err: "You have been logged out."})
            localStorage.setItem("modalHidden", "false");
            navigate("/", {
                state: {
                    fromLogOut: true
                }
            })
        }).catch(err => {
            console.error("Error logging out:", err)
        })
    }

    for(const key in profileDetails){
        profileDetailsElements.push(
            <ul key={key}>
                <h4>
                    {key}:
                </h4>
                <ul>
                    {profileDetails[key]}
                </ul>
            </ul>
        )
    }


    return (
        <div>
            <h1>Profile</h1>
            <ul>
                {profileDetailsElements}
            </ul>
            <button 
            style={{display: logged.isLogged ? "block" : "none"}}
            onClick={logOut}>Log out</button>
        </div>
    )
}