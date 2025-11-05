import React from "react";
import defaultImage from "./assets/default.jpg"
import CourseCard from "./CourseCard";

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

    const courseElements = cursuri.map((curs, index) => (
        <CourseCard 
            curs={curs}
            key={index}
        />
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