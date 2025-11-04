import React from "react";
import { NavLink, useNavigate } from "react-router"

export default function(){
    const [username, setUsername] = React.useState("")
    const [password, setPassword] = React.useState("")
    const redirectLogIn = useNavigate()


    function login(e){
        e.preventDefault()
            fetch("/api/login", {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    password
                })            
            }).then(res => res.json())
            .then(data => {
                redirectLogIn("/profile", {
                    state: {
                        fromLogin: true
                    }
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