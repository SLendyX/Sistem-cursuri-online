import React from "react";

export default function(){

    function login(e){
        e.preventDefault()
        return;
    }


    return(
        <form onSubmit={login}>
            <input type="email" placeholder="email"/>
            <input type="password" placeholder="password" />
            <button>Login</button>
        </form>
    )
}