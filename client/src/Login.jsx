import React from "react";

export default function(){
    const [username, setUsername] = React.useState("")
    const [password, setPassword] = React.useState("")

    function login(e){
        e.preventDefault()
        React.useEffect(() => {
            fetch("/api/login", {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    password
                })            
            })
        }, [])

        return;
    }


    return(
        <form onSubmit={login}>
            <input 
                required
                type="text" 
                placeholder="username" 
                onInput={setUsername(username)}
                value={username}
            />
            <input 
                required
                type="password" 
                placeholder="password" 
                onInput={setPassword(password)}
            />
            <button>Login</button>
        </form>
    )
}