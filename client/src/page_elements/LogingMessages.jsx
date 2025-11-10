import React from "react";
import PopUpMessage from "./PopUpMessage";

export default function({changeFlag, popUpType=0, children,...props}){
    const pClass = ["success-message", "info-message", "error-message"]

    return(
        <PopUpMessage 
            divClass="popup-message"
            pClass={pClass[popUpType]}
            changeFlag={changeFlag}
        >
            {children}
        </PopUpMessage>
    )
}