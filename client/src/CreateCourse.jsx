import React from "react";
import { useNavigate } from "react-router";
import PopUpMessage from "./page_elements/PopUpMessage";

export default function(){
    const [numeCurs, setNumeCurs] = React.useState("")
    const [desc, setDesc] = React.useState("")
    const [dificultate, setDificultate] = React.useState("usor")
    const [pret, setPret] = React.useState("")
    
    // State-uri noi pentru imagine și erori
    const [imageFile, setImageFile] = React.useState(null)
    const [previewUrl, setPreviewUrl] = React.useState(null)
    const [isDragging, setIsDragging] = React.useState(false)
    const [errorMessage, setErrorMessage] = React.useState("")

    const navigate = useNavigate()

    // Păstrăm structura ta de state pentru input-urile text
    const state = {
        variables: [numeCurs, desc, dificultate, null, pret], // null pentru imagine, o tratăm separat
        setFunc: [setNumeCurs, setDesc, setDificultate, null, setPret]
    }
    
    const fieldsArray = ["nume curs", "descriere", "dificultate", "thumbnail image", "pret"]

    // --- Logică Drag & Drop ---
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        validateAndSetImage(file);
    };
    const handleFileSelect = (e) => {
        validateAndSetImage(e.target.files[0]);
    };
    const validateAndSetImage = (file) => {
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setErrorMessage("");
        } else {
            setErrorMessage("Te rog încarcă un fișier imagine valid.");
            localStorage.setItem("modalHidden", "false");
        }
    };
    // ---------------------------

    function handleSubmit(e) {
        e.preventDefault();
        setErrorMessage("");

        const formData = new FormData();
        formData.append("numeCurs", numeCurs);
        formData.append("descriere", desc);
        formData.append("dificultate", dificultate);
        formData.append("pret", pret);
        if (imageFile) formData.append("image", imageFile);

        fetch("/api/courses", {
            method: "POST",
            body: formData 
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            return data;
        })
        .then(() => {
            alert("Curs creat cu succes!");
            navigate("/courses");
        })
        .catch(err => {
            setErrorMessage(err.message);
            localStorage.setItem("modalHidden", "false");
        });
    }

    const fieldElements = {
        labels: <div className="field-labels">
            {fieldsArray.map(field => (
                <label className="field-label" key={`label-${field}`} htmlFor={field.replace(" ", "-")}>
                    {field}
                </label>
            ))}
        </div>,
        
        inputs: <div className="field-inputs">
            {fieldsArray.map((field, index) => {
                const inputId = field.replace(" ", "-");

                // Cazul 1: Select pentru dificultate
                if(field === "dificultate"){
                    return (
                        <select 
                            key={index}
                            id={inputId} 
                            value={state.variables[index]} 
                            onChange={e => state.setFunc[index](e.target.value)}
                        >
                            <option value="usor">usor</option>
                            <option value="mediu">mediu</option>
                            <option value="greu">greu</option>
                        </select>
                    )
                }

                // Cazul 2: Zona de Drop pentru imagine
                if(field === "thumbnail image"){
                    return (
                        <div 
                            key={index}
                            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('hidden-file-input').click()}
                        >
                            <input 
                                id="hidden-file-input"
                                type="file" 
                                accept="image/*"
                                onChange={handleFileSelect}
                                style={{display: 'none'}} 
                            />
                            {previewUrl ? (
                                <div className="image-preview-mini">
                                    <img src={previewUrl} alt="Preview" />
                                    <span>Change</span>
                                </div>
                            ) : (
                                <span className="drop-text">Click or Drop Image</span>
                            )}
                        </div>
                    )
                }

                // Cazul 3: Input text normal (pentru nume, descriere, pret)
                return (
                    <input 
                        key={index}
                        id={inputId} 
                        type={field === "pret" ? "number" : "text"} 
                        value={state.variables[index]} 
                        onChange={e => state.setFunc[index](e.target.value)}
                    />
                )
            })}
        </div>
    }

    return(
        <>
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
            <form className="profile-form" onSubmit={handleSubmit}>
                {fieldElements.labels}
                {fieldElements.inputs}
                <button className="create-course-btn" style={{display:'none'}}>Submit Hidden</button> 
            </form>
            {/* Butonul de submit scos în afară sau stilizat separat, cum era în layout-ul tău */}
            <button onClick={handleSubmit} className="create-course-btn">Create new Course</button>
        </>
    )
}