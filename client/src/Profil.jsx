import React, { useContext } from "react";
import { LoggedContext } from "./context/LoggedContext";
import { useNavigate } from "react-router";

export default function(){
    const [profileDetails, setProfileDetails] = React.useState({})
    let profileDetailsElements = {}

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
        .catch(err => setProfileDetails(err))
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
                    fromLogOut: true,
                    message:"Logged out succesfully"
                }
            })
        }).catch(err => {
            console.error("Error logging out:", err)
        })
    }

    profileDetailsElements.labels = Object.keys(profileDetails).map(key => 
    {
        if(key!=="userId" && key !== "isLogged"){
            return(
                    <label htmlFor={`profile-${key}`} className="field-label" key={`label-${key}`}>{key}:</label>
            )
        }
    }
    )

    profileDetailsElements.inputs = Object.keys(profileDetails).map(key => 
    {
        if(key === "email_verified"){
            return(
                    <input id={`profile-${key}`}  key={`input-${key}`} type="checkbox" checked={profileDetails[key]} readOnly />
            )
        }

        if(key!=="userId" && key !== "isLogged"){
            return(
                    <input id={`profile-${key}`} key={`input-${key}`} type="text" value={profileDetails[key]} readOnly />
            )
        }
    })




    return (
        <div className="profile-container">
            <h1>Profile</h1>

            {/* Error or logout message */}
            {profileDetails.error && (
                <p style={{ color: "red" }}>{profileDetails.error}</p>
            )}

            {/* Loading state */}
            {Object.keys(profileDetails).length === 0 && !profileDetails.err && (
                <p>Loading...</p>
            )}

            {/* Profile form */}
            {profileDetails.username && (
                <form className="profile-form">
                    <div className="field-labels">
                        {profileDetailsElements.labels}
                    </div>
                    <div className="field-inputs">
                        {profileDetailsElements.inputs}
                    </div>
                </form>
            )}

            {/* Log out button */}
            {logged.isLogged && (
                <button onClick={logOut} className="logout-btn">
                    Log out
                </button>
            )}
        </div>
    )
}