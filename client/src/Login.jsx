import React from "react";

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
        <form onSubmit={login}>
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
        </form>
    )
}