import React from "react";

export default function(){
    const [profileDetails, setProfileDetails] = React.useState({})
    const profileDetailsElements = []

    function logOut(){
        fetch("/api/logout", {
                method: 'POST',
                headers: { "Content-Type": "application/json" }            
            })
        .then(res => res.json())
        .then(data => {
            return data
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

    React.useEffect(() => {
        fetch("/api/profile")
        .then(res => res.json())
        .then(data => setProfileDetails(data));
    }, []);

    return (
        <div>
            <h1>Profile</h1>
            <ul>
                {profileDetailsElements}
            </ul>
            <button onClick={logOut}>Log out</button>
        </div>
    )
}