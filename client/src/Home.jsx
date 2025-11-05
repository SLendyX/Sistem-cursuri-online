import { useEffect, useState } from "react";
import defaultImage from "./assets/default.jpg"

export default function () {
  const imagePath = 
  useEffect(() => {

  }, [])

  return (
    <>
      <section className="hero">
        <h2>Expand Your Knowledge</h2>
        <p>Browse courses from top instructors and start learning today.</p>
        <a href="/courses" className="btn">Browse Courses</a>
      </section>

      <section className="courses">
      <h2>Featured Courses</h2>
      <div className="course-grid">
        <div className="course-card">
          <img className="course-thumbnail" src={defaultImage} alt="Course thumbnail" />
          <h3>Introduction to Programming</h3>
          <p>By John Doe</p>
        </div>

        <div className="course-card">
          <img className="course-thumbnail" src={defaultImage} alt="Course thumbnail" />
          <h3>Advanced Web Development</h3>
          <p>By Jane Smith</p>
        </div>

        <div className="course-card">
          <img className="course-thumbnail" src={defaultImage} alt="Course thumbnail" />
          <h3>Data Science Basics</h3>
          <p>By Mark Lee</p>
        </div>
      </div>
    </section>
    </>
  )
}

