import React from "react";

export default function(){
    const [numeCurs, setNumeCurs] = React.useState("")
    const [desc, setDesc] = React.useState("")
    const [dificultate, setDificultate] = React.useState("")
    const [thumbnailUrl, setThumbnailUrl] = React.useState("")
    const [pret, setPret] = React.useState("")


    React.useEffect(() => {
        fetch("/api/courses/")
        .then(res => res.json())
        .then(data => {
            console.log(data)
        })
    }, [])

    const state = {
        variables: [numeCurs, desc, dificultate, thumbnailUrl, pret],
        setFunc: [setNumeCurs, setDesc, setDificultate, setThumbnailUrl, setPret]
    }
    const fieldsArray = ["nume curs", "descriere", "dificultate", "thumbnail image", "pret"]
    const fieldElements = {
        labels:<div className="field-labels">
            {fieldsArray.map(field => (
                <label className="field-label" key={`label-${field}`} htmlFor={field.replace(" ", "-")}>{field}</label>
            ))}
            </div>, 
        inputs: <div className="field-inputs">

                {fieldsArray.map((field, index)=>{
                    if(field === "dificultate"){
                        return (
                            <select id={field.replace(" ", "-")} type="text" value={state.variables[index]} onChange={e => state.setFunc[index](e.target.value)}>
                                <option>usor</option>
                                <option>mediu</option>
                                <option>greu</option>
                            </select>
                        )
                    }
                

                return (
                    <input id={field.replace(" ", "-")} type="text" value={state.variables[index]} onChange={e => state.setFunc[index](e.target.value)}/>

                )

            })}
        </div>
    }

    return(
        <>
            <h1>Create a new course</h1>
            <form className="profile-form">
                {fieldElements.labels}
                {fieldElements.inputs}
            </form>
            <button className="create-course-btn">Create new Course</button>
        </>
    )
}