import React from "react";
import { useNavigate } from "react-router";
import PopUpMessage from "./page_elements/PopUpMessage";

export default function(){
    const [numeCurs, setNumeCurs] = React.useState("")
    const [desc, setDesc] = React.useState("")
    const [dificultate, setDificultate] = React.useState("usor") // Default valid
    const [thumbnailUrl, setThumbnailUrl] = React.useState("")
    const [pret, setPret] = React.useState("")
    
    // State pentru eroare
    const [errorMessage, setErrorMessage] = React.useState("")

    const navigate = useNavigate();

    const state = {
        variables: [numeCurs, desc, dificultate, thumbnailUrl, pret],
        setFunc: [setNumeCurs, setDesc, setDificultate, setThumbnailUrl, setPret]
    }
    
    // Mapare corectă a numelor pentru afișare vs. state
    const fieldsArray = ["nume curs", "descriere", "dificultate", "image", "pret"]

    function handleSubmit(e) {
        e.preventDefault();
        setErrorMessage(""); // Resetăm eroarea înainte de request

        const courseData = {
            numeCurs,
            descriere: desc,
            dificultate,
            thumbnailUrl,
            pret
        };

        fetch("/api/courses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(courseData)
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }
            return data;
        })
        .then(() => {
            // Succes - redirecționăm utilizatorul
            alert("Curs creat cu succes!");
            navigate("/courses"); 
        })
        .catch(err => {
            // Setăm 'modalHidden' pe false pentru a ne asigura că popup-ul apare din nou
            localStorage.setItem("modalHidden", "false");
            setErrorMessage(err.message);
        });
    }

    const fieldElements = {
        labels: <div className="field-labels">
            {fieldsArray.map(field => (
                <label className="field-label" key={`label-${field}`} htmlFor={field.replace(" ", "-")}>
                    {field}:
                </label>
            ))}
        </div>, 
        inputs: <div className="field-inputs">
            {fieldsArray.map((field, index) => {
                const inputId = field.replace(" ", "-");
                
                if(field === "dificultate"){
                    return (
                        <select 
                            id={inputId} 
                            key={inputId}
                            value={state.variables[index]} 
                            onChange={e => state.setFunc[index](e.target.value)}
                        >
                            <option value="usor">usor</option>
                            <option value="mediu">mediu</option>
                            <option value="greu">greu</option>
                        </select>
                    )
                }



                return (
                    <input 
                        id={inputId} 
                        key={inputId}
                        type={field === "pret" ? "number" : field === "image" ? "file" : "text"} 
                        value={state.variables[index]} 
                        onChange={e => state.setFunc[index](e.target.value)}
                        required={field !== "thumbnail image"} // Imaginea e opțională în backend
                    />
                )
            })}
        </div>
    }

    return(
        <>
            {/* Afișare eroare folosind componenta PopUpMessage */}
            {errorMessage && (
                <PopUpMessage 
                    divClass="popup-message"
                    pClass="error-message"
                    changeFlag={errorMessage}
                >
                    {errorMessage}
                </PopUpMessage>
            )}

            <h1>Create a new course</h1>
            <form className="course-form" onSubmit={handleSubmit}>
                <div className="course-inputs">
                    {fieldElements.labels}
                    {fieldElements.inputs}
                </div>
                
                {/* Butonul trebuie să fie în form pentru a declanșa onSubmit */}
                <button className="create-course-btn">Create new Course</button>
            </form>
        </>
    )
}