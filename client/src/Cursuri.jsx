import React from "react";
import defaultImage from "./assets/default.jpg"

export default function(){
    React.useEffect(()=>{
        // fetch()
        setCursuri([
            {
                autor: "John Doe",
                numeCurs: "Introduction to Programming",
                pret: "$49.99",
                imagine: `${defaultImage}`,
                descriere: "Learn the basics of programming using Python."
            },
            {
                autor: "Jane Smith",
                numeCurs: "Advanced Web Development",
                pret: "$79.99",
                imagine: `${defaultImage}`,
                descriere: "Master advanced web development techniques and frameworks."
            }
        ])
    }, [])

    const [cursuri, setCursuri] = React.useState([])

    /*
        -autor
        -nume curs
        -pret
        -imagine
        -descriere

        <div className="course-card">
            <h3>{numeCurs}</h3>
            <img className="course-thumbnail" src={imagine} alt={numeCurs} />
            <div className="course-info">
                <p className="course-description">{descriere}</p>
            </div>
            <div className="course-footer">
                <p className="course-price">Price: {pret}</p>
                <p className="course-author">By {autor}</p>
            </div>
        </div>
    */
    const courseElements = cursuri.map((curs, index) => (
        <div className="course-card" key={index}>
            <h3>{curs.numeCurs}</h3>
            <img className="course-thumbnail" src={curs.imagine} alt={curs.numeCurs} />
            <div className="course-info">
                <p className="course-description">{curs.descriere}</p>
            </div>
            <div className="course-footer">
                <p className="course-price">Price: {curs.pret}</p>
                <p className="course-author">By {curs.autor}</p>
            </div>
        </div>
    ))

    return (
        <>
            <h1 className="course-title">Cursuri</h1>
            <div className="courses-container">
                <div className="course-list">
                    {courseElements}
                </div>
            </div>
        </>
    )
}