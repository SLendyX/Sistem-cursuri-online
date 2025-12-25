import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router";
import './index.css'

// Layouts & Providers
import AuthProvider from './context/AuthProvider.jsx'; // Noul Provider
import StudentLayout from './page_elements/StudentLayout.jsx'; // Fostul Dashboard, acum layout general
import ProfessorLayout from './page_elements/ProfessorLayout.jsx'; // Noul layout

// Pages
import Home from './Home.jsx'
import Login from "./Login.jsx"
import Profile from "./Profil.jsx"
import Courses from "./Cursuri.jsx"
import Course from "./Curs.jsx"
import About from './About.jsx';
import Register from './Register.jsx';
import CreateCourse from './CreateCourse.jsx';
import CourseEditorLayout from './CourseEditorLayout.jsx';
import CreatedCourses from './CreatedCourses.jsx';

// Guards
import RequireAuth from './RequireAuth.jsx';
import PublicOnlyRoute from './PublicOnlyRoute.jsx';
import TeacherOnlyRoute from './TeacherOnlyRoute.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Mutăm BrowserRouter afară pentru ca AuthProvider să poată folosi eventual hooks de navigare, deși fetch-ul e independent */}
    {/* De fapt AuthProvider folosește fetch, deci e ok să fie oriunde, dar e bine să învelească tot */}
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ================================================= */}
          {/* ZONA 1: STUDENT & PUBLIC (Folosește Layout Standard) */}
          {/* ================================================= */}
          <Route element={<StudentLayout />}>
            <Route index element={<Home />} />

            <Route element={<PublicOnlyRoute />}>
              <Route path='login' element={<Login />} />
              <Route path='register' element={<Register />} />
            </Route>

            <Route path='about' element={<About />} />

            {/* Rute accesibile logat, dar în layout de student */}
            <Route element={<RequireAuth />}>
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path='courses'>
              <Route index element={<Courses />} />
              <Route path=":courseId" element={<Course />} />
            </Route>
          </Route>


          {/* ================================================= */}
          {/* ZONA 2: PROFESOR (Folosește Layout Instructor)    */}
          {/* ================================================= */}
          <Route path="instructor" element={<TeacherOnlyRoute />}>
            <Route element={<ProfessorLayout />}>
              {/* Aici poți face o pagină DashboardInstructor.jsx */}
              <Route index element={<h1>Dashboard Instructor (Statistici, etc)</h1>} />

              <Route path="profile" element={<Profile />} />

              <Route path="create_course" element={<CreateCourse />} />
              <Route path='my_courses' element={<CreatedCourses/>} />

              {/* Editorul de curs poate avea propriul layout sau folosi pe cel de prof */}
              <Route path="course/:courseId/edit" element={<CourseEditorLayout />}>
                {/* Sub-rute pentru editor */}
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)


/*
          <Route path="instructor/course/:courseId/edit" element={<CourseEditorLayout />}>
            <Route index element={<CourseCurriculumEditor />} />
            <Route path="lesson/:lessonId" element={<LessonContentEditor />} /> 
          </Route>

*/
