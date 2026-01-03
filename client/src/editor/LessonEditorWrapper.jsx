import { useParams } from 'react-router';
import LessonEditor from './LessonEditor'; 
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, CircularProgress } from '@mui/material';

// 1. Create this simple wrapper
export default function () {
    // ✅ usage of hook is allowed here because it's inside a component
    const { lessonId } = useParams();
    const queryClient = useQueryClient()

    const { data: lesson, isLoading, isFetching } = useQuery({
        queryKey: ['lesson', lessonId],
        queryFn: () => fetch(`/api/lessons/${lessonId}`).then(res => res.json()),
        staleTime: 0,
        keepPreviousData: false,
        refetchOnMount: 'always',
        refetchOnWindowFocus: false
    });

    if(isLoading || isFetching){
        return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
    }

    return <LessonEditor key={lessonId} lessonId={lessonId} initialData={lesson} queryClient={queryClient}/>;
};