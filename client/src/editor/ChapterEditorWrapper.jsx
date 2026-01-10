import { useParams } from 'react-router';
import ChapterEditor from './ChapterEditor';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, CircularProgress } from '@mui/material';

// 1. Create this simple wrapper
export default function () {
    // ✅ usage of hook is allowed here because it's inside a component
    const { chapterId } = useParams();
    const queryClient = useQueryClient()

    const { data: chapter, isLoading, isFetching } = useQuery({
        queryKey: ['chapter', chapterId],
        queryFn: () => fetch(`/api/author/chapters/${chapterId}`).then(res => res.json()),
        staleTime: 0,
        refetchOnMount: 'always',
        keepPreviousData: false,
    })

    if (isLoading) {
        return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
    }

    // ✅ The 'key' prop forces React to destroy and recreate 
    // the LessonEditor whenever lessonId changes.
    return <ChapterEditor key={chapterId} chapterId={chapterId} initialData={chapter} queryClient={queryClient}/>;
};