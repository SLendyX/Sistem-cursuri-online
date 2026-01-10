import { useLocation, useMatch, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Box, CircularProgress } from "@mui/material";

import CourseEditorLayout from "./CourseEditorLayout";

export default function useCourseStructure (){  
    const location = useLocation();
    const queryClient = useQueryClient()
    const { courseId } = useParams();

    const chapterMatch = useMatch("/instructor/course/:courseId/edit/chapter/:chapterId/*");
    const currentChapterId = chapterMatch?.params?.chapterId;

    const lessonMatch = useMatch("/instructor/course/:courseId/edit/chapter/:chapterId/lesson/:lessonId");
    const currentLessonId = lessonMatch?.params?.lessonId;

    const searchParams = new URLSearchParams(location.search);
    const isLessonView = searchParams.get('view') === 'lessons';
    const isChapterMode = Boolean(currentLessonId || isLessonView);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['course', courseId, 'structure'],
        queryFn: async () => {
            const res = await fetch(`/api/author/courses/${courseId}/structure`);
            if (!res.ok) throw new Error("Failed to load structure");
            return res.json();
        },
        staleTime: Infinity, // The structure rarely changes unless you drag/drop
    });

    if(isLoading){
        return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
    }

    return <CourseEditorLayout key={`${currentChapterId}_${currentLessonId}`} courseId={courseId} lessonId={currentLessonId} chapterId={currentChapterId} initialData={data} isChapterMode={isChapterMode} queryClient={queryClient}/>;
};