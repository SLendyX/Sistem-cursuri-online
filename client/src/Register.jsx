import React from "react";
import { NavLink, useNavigate } from "react-router"
import { LoggedContext } from "./context/LoggedContext";

export default function(){
    const [username, setUsername] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [retypePassword, setRetypePassword] = React.useState("")
    const [name, setName] = React.useState("")
    const [type, setType] = React.useState("professor")

    const [errorMessage, setErrorMessage] = React.useState("")

    const redirectRegister = useNavigate()
    const logged = React.useContext(LoggedContext)

    const stateArray = {
        constants:[username, email, password, retypePassword, name],
        functions:[setUsername, setEmail, setPassword, setRetypePassword, setName],
        names:["username", "email", "password",  "retype password", "name"],
        types:["text", "email", "password", "password", "text"],
        required:[true, true, true, true, false],
    }

    const inputElementArray = stateArray.constants.map((value, index) => {
        return(
            <input 
                key={index}
                name={stateArray.names[index]}
                type={stateArray.types[index]}
                placeholder={stateArray.names[index]} 
                value={value}
                onChange={e => stateArray.functions[index](e.target.value)}
                required={stateArray.required[index]}
            />
        )
    })

    function sendRegister(e){
        if(password != retypePassword){
            console.log("Passwords must be the same")
            return
        }
        e.preventDefault()

        fetch("/api/register", {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    type,
                    name
                })            
            }).then(async res => {
                const data = await res.json();

                if (!res.ok) {
                    throw { error: data.error || "Something went wrong." };
                }

                return data;
            })
            .then(data => {
                logged.setIsLogged(true)
                localStorage.setItem("modalHidden", "false");
                redirectRegister("/profile", {
                    state: {
                        fromLogin: true
                    }
                })
            })
            .catch(err => {
                setErrorMessage(err)
            })

        return
    }


    return (
        <>
            <h1>Register</h1>
            <form onSubmit={sendRegister} className="register-form">
                {inputElementArray}
                <select value={type} onChange={e => setType(e.target.value)}>
                    <option>professor</option>
                    <option>student</option>
                </select>
                <p className="login-text">Already have an account?</p>
                <NavLink className={"redirect-link"} to={"/login"}>Login here</NavLink>

                <button>Register</button>
                {errorMessage !== "" && <p className="error-message">{errorMessage}</p>}
                <label style={{display: password != retypePassword ? "block" : "none", color:"red"}}>Passwords are not same</label>
            </form>
        </>
    )
}