import React from "react";

export default function(){
    const [username, setUsername] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [retypePassword, setRetypePassword] = React.useState("")
    const [name, setName] = React.useState("")
    const [type, setType] = React.useState("professor")

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
            })

        return
    }


    return (
        <>
            <h1>Register</h1>
            <form onSubmit={sendRegister}>
                {inputElementArray}
                <select value={type} onChange={e => setType(e.target.value)}>
                    <option>professor</option>
                    <option>student</option>
                </select>

                <label style={{display: password != retypePassword ? "block" : "none"}}>Passwords are not same</label>

                <button>Register</button>
            </form>
        </>
    )
}