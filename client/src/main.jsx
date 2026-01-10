import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router";
import './index.css'

// Layouts & Providers
import AuthProvider from './context/AuthProvider.jsx';
import StudentLayout from './student_experience/StudentLayout.jsx';
import ProfessorLayout from './instructor/ProfessorLayout.jsx';
import CoursePlayerLayout from './student_experience/CoursePlayerLayout.jsx';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Pages
import Home from './general/Home.jsx'
import Login from "./authentification/Login.jsx"
import Profile from "./general/Profil.jsx"
import Courses from "./course_componenents/Cursuri.jsx"
import CourseLanding from './course_componenents/CourseLanding.jsx';
import LessonPlayer from './student_experience/LessonPlayer.jsx';
import About from './general/About.jsx';
import Register from './authentification/Register.jsx';
import CreateCourse from './instructor/CreateCourse.jsx';
import CourseEditorLayoutWrapper from './editor/CourseEditorLayoutWrapper.jsx';
import CreatedCourses from './instructor/CreatedCourses.jsx';
import LessonEditorWrapper from './editor/LessonEditorWrapper.jsx';
import ChapterEditorWrapper from './editor/ChapterEditorWrapper.jsx';
import CourseEditorWrapper from './editor/CourseEditorWrapper.jsx';
import Statistics from './instructor/Statistics.jsx'; // NEW
import MyLearning from './student_experience/MyLearning.jsx'; // NEW
import InstructorProfile from './student_experience/InstructorProfile.jsx';
// Guards
import RequireAuth from './protected/RequireAuth.jsx';
import PublicOnlyRoute from './protected/PublicOnlyRoute.jsx';
import TeacherOnlyRoute from './protected/TeacherOnlyRoute.jsx';

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* ================================================= */}
            {/* STUDENT & PUBLIC ROUTES */}
            {/* ================================================= */}
            <Route element={<StudentLayout />}>
              <Route index element={<Home />} />

              <Route element={<PublicOnlyRoute />}>
                <Route path='login' element={<Login />} />
                <Route path='register' element={<Register />} />
              </Route>

              <Route path='about' element={<About />} />

              <Route element={<RequireAuth />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/my-learning" element={<MyLearning />} /> {/* NEW */}
              </Route>

              {/* Course Browse & Landing Pages */}
              <Route path='courses'>
                <Route index element={<Courses />} />
                <Route path=":courseId" element={<CourseLanding />} />
              </Route>
              {/* Instructor Public Profile */}
              <Route path="/instructor_profile/:instructorId" element={<InstructorProfile />} />
            </Route>

            {/* ================================================= */}
            {/* COURSE PLAYER (Student Learning View) */}
            {/* ================================================= */}
            <Route path="course/:courseId/learn" element={<RequireAuth />}>
              <Route element={<CoursePlayerLayout />}>
                <Route index element={
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <h3>Select a lesson from the sidebar to begin</h3>
                  </div>
                } />
                <Route path="lesson/:lessonId" element={<LessonPlayer />} />
              </Route>
            </Route>

            {/* ================================================= */}
            {/* PROFESSOR ROUTES */}
            {/* ================================================= */}
            <Route path="instructor" element={<TeacherOnlyRoute />}>
              <Route element={<ProfessorLayout />}>
                <Route index element={<CreatedCourses />} /> {/* Changed from Dashboard to Courses */}
                <Route path="profile" element={<Profile />} />
                <Route path="statistics" element={<Statistics />} /> {/* NEW */}
                <Route path="create_course" element={<CreateCourse />} />
                <Route path='my_courses' element={<CreatedCourses />} />

                {/* Course Editor Routes */}
                <Route path="course/:courseId/edit" element={<CourseEditorLayoutWrapper />}>
                  <Route index element={<CourseEditorWrapper />} />
                  <Route path="chapter/:chapterId">
                    <Route index element={<ChapterEditorWrapper />} />
                    <Route path="lesson/:lessonId" element={<LessonEditorWrapper/>} />
                  </Route>
                </Route>
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)