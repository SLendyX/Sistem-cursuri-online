import React from "react";
import PopUpMessage from "./PopUpMessage";
import { LoggedContext } from "../context/LoggedContext";
import { useContext } from "react";

export default function({fromLogin, fromLogOut, ...props}){
    const {isLogged} = useContext(LoggedContext)

    return(
        fromLogin ? 
        <PopUpMessage 
            divClass="popup-message"
            pClass="success-message"
            changeFlag={isLogged}
        >
            You have logged in succesfully!
        </PopUpMessage>
     : fromLogOut ?
        <PopUpMessage 
            divClass="popup-message"
            pClass="info-message"
            changeFlag={isLogged}
        >
            You have logged out succesfully!
        </PopUpMessage>
        :
         <></>
        
    )
}