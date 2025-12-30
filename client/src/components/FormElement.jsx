import React from "react";

export default function({fieldsArray, pageName, readOnly}){
    const fieldElements = {
        labels: fieldsArray.map(field => (
            <label className="field-label" key={`${pageName}-${field}`} htmlFor={field.replace(" ", "-")}>{field}</label>
        )),
        inputs: fieldsArray.map(field => {
            
        })
    }

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
}