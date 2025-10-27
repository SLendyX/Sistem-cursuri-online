import React from "react";

export default function(){
    const [profileDetails, setProfileDetails] = React.useState({})

    const profileDetailsElements = []

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
        fetch("/api/me")
        .then(res => res.json())
        .then(data => setProfileDetails(data));
    }, []);

    return (
        <div>
            <h1>Profile</h1>
            <li>
                {profileDetailsElements}
            </li>
        </div>
    )
}