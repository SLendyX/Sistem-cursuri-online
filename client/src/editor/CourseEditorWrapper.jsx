import { useParams } from 'react-router';
import CourseEditor from './CourseEditor'; 
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, CircularProgress } from '@mui/material';

// 1. Create this simple wrapper
export default function () {
    // ✅ usage of hook is allowed here because it's inside a component
    const { courseId } = useParams();
    const queryClient = useQueryClient()

    const { data: course, isLoading, isFetching } = useQuery({
        queryKey: ['course', courseId],
        queryFn: () => fetch(`/api/courses/${courseId}`).then(res => res.json()),
        staleTime: 0,
        keepPreviousData: false,
        refetchOnMount: 'always',
        refetchOnWindowFocus: false
    });

    if(isLoading || isFetching){
        return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
    }

    return <CourseEditor key={courseId} courseId={courseId} initialData={course} queryClient={queryClient}/>;
};