import { useState, useEffect, useRef, useCallback } from 'react';

export default function useAutoSave({ 
    data, 
    recordId,        // NEW: Pass lessonId/courseId here to detect switching
    onSave,          // Async function that returns the updated version
    onConflict,      // NEW: specific handler for 409 errors
    debounceMs = 2000 
}) {
    const [status, setStatus] = useState('saved');
    const [lastSaved, setLastSaved] = useState(null);
    
    // Refs for state that shouldn't trigger re-renders
    const dataRef = useRef(data);
    const prevIdRef = useRef(recordId);
    const isDirtyRef = useRef(false);
    const saveTimerRef = useRef(null);

    // 1. Sync Data Ref
    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    // 2. The Core Save Logic
    const performSave = useCallback(async (dataToSave, isUnmount = false) => {
        if (!isUnmount) setStatus('saving');
        
        try {
            // Your onSave should return the new version number
            await onSave(dataToSave); 
            
            if (!isUnmount) {
                setStatus('saved');
                setLastSaved(new Date());
                isDirtyRef.current = false;
            }
        } catch (err) {
            console.error("AutoSave failed:", err);
            
            // Handle 409 Conflict specifically
            if (err.status === 409 && onConflict) {
                setStatus('error'); // or 'conflict'
                onConflict(); 
            } else {
                if (!isUnmount) setStatus('error');
            }
        }
    }, [onSave, onConflict]);

    // 3. Handle ID Switching (The "Flush" Logic)
    // If user clicks Lesson B while Lesson A is dirty, save A immediately.
    useEffect(() => {
        if (prevIdRef.current !== recordId) {
            if (isDirtyRef.current) {
                console.log(`Switching ID from ${prevIdRef.current} to ${recordId} - Flushing save`);
                performSave(dataRef.current, true); // True = treat as unmount/background save
            }
            // Reset for new ID
            isDirtyRef.current = false;
            setStatus('saved');
            prevIdRef.current = recordId;
        }
    }, [recordId, performSave]);

    // 4. Trigger Auto-Save on Change
    useEffect(() => {
        // Don't save on initial load or if data hasn't actually changed
        // (You might want a deep comparison here eventually)
        if (JSON.stringify(data) === JSON.stringify(dataRef.current) && !isDirtyRef.current) return;

        isDirtyRef.current = true;
        setStatus('saving');

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            performSave(dataRef.current);
        }, debounceMs);

        return () => clearTimeout(saveTimerRef.current);
    }, [data, debounceMs, performSave]);

    // 5. Cleanup on Unmount
    useEffect(() => {
        return () => {
            if (isDirtyRef.current) {
                performSave(dataRef.current, true);
            }
        };
    }, [performSave]);

    return { status, lastSaved };
}