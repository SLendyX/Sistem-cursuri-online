import React from "react";
import { NavLink } from "react-router"

export default function(){
    const [username, setUsername] = React.useState("")
    const [password, setPassword] = React.useState("")

    function login(e){
        e.preventDefault()
            fetch("/api/login", {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    password
                })            
            })
        return;
    }


    return(
        <>
            <h1>Login</h1>
            <form onSubmit={login} className="login-form">
                <input 
                    required
                    type="text" 
                    placeholder="username" 
                    onChange={e => setUsername(e.target.value)}
                    value={username}
                />
                <input 
                    required
                    type="password" 
                    placeholder="password" 
                    onChange={e => setPassword(e.target.value)}
                />
                <button>Login</button>
                <p className="register-text">Don't have an account?</p>
                <NavLink className={"redirect-link"} to={"/register"}>Register here</NavLink>
            </form>
        </>
    )
}