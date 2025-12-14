import React from "react";
import defaultImage from "./assets/default.jpg"
import CourseCard from "./CourseCard";


export default function(){
    const [courses, setCourses] = React.useState([])

    React.useEffect(()=>{
        fetch("api/courses")
        .then(res => res.json())
        .then(data => {
            setCourses(data)
        })
    }, [])

    const courseElements = courses.map((curs, index) => (
        <CourseCard 
            curs={curs}
            key={index}
        />
    ))

    return (
        <>
            <h1 className="">Cursuri</h1>
            <div className="courses-container">
                <div className="course-list">
                    {courseElements}
                </div>
            </div>
        </>
    )
}