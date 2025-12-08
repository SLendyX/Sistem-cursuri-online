import React from "react";
import { NavLink, useNavigate } from "react-router"
import { LoggedContext } from "./context/LoggedContext";

export default function(){
    const [username, setUsername] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [errorMessage, setErrorMessage] = React.useState("")

    const redirectLogIn = useNavigate()
    const logged = React.useContext(LoggedContext)

    function login(e) {
        e.preventDefault();

        fetch("/api/login", {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        })
        .then(async res => {
            const data = await res.json(); // parse JSON response

            if (!res.ok) {
                throw { error: data.error || "Something went wrong." };
            }

            return data;
        })
        .then(data => {
            logged.setIsLogged(true);
            localStorage.setItem("modalHidden", "false");
            redirectLogIn("/profile", { state: { 
                fromLogin: true,
                message:"Logged in succesfully!" 
            } });
        })
        .catch(err => {
            setErrorMessage(err.error);
        });
    }

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setErrorMessage("")
        }, 1500);

        // Cleanup timeout if component unmounts or dependency changes
        return () => clearTimeout(timer); 
    }, [errorMessage]);


    return(
        <>
            <h1>Login</h1>
            <form onSubmit={login} className="login-form">
                <input 
                    required
                    type="text"
                    placeholder="username/email" 
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
                {errorMessage !== "" && <p className="error-message">{errorMessage}</p>}
                <p className="register-text">Don't have an account?</p>
                <NavLink className={"redirect-link"} to={"/register"}>Register here</NavLink>
            </form>
        </>
    )
}