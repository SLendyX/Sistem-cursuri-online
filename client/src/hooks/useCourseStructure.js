import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";

export function useCourseStructure (courseId){  
    return useQuery({
        queryKey: ['course', courseId, 'structure'],
        queryFn: async () => {
            const res = await fetch(`/api/courses/${courseId}/structure`);
            if (!res.ok) throw new Error("Failed to load structure");
            return res.json();
        },
        staleTime: Infinity, // The structure rarely changes unless you drag/drop
    });
};