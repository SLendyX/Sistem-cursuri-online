import { useState, useEffect, useRef, useCallback } from 'react';

export default function useAutoSave({
    data,
    onSave,
    onConflict,
    debounceMs = 2000
}) {
    const [status, setStatus] = useState('saved');
    const [lastSaved, setLastSaved] = useState(null);

    // Refs for latest values (to avoid stale closures in timeouts/effects)
    const onSaveRef = useRef(onSave);
    const onConflictRef = useRef(onConflict);
    const dataRef = useRef(data);
    
    // 1. LOCK: Track if a request is currently flying
    const isSavingRef = useRef(false);
    const isDirtyRef = useRef(false);
    const saveTimerRef = useRef(null);

    // 🆕 SIMPLIFICATION: Initialize baseline immediately. 
    // Since the Wrapper guarantees 'data' is real on mount, we don't need effects to sync this.
    const [lastSavedString, setLastSavedString] = useState(() => JSON.stringify(data));

    // Keep Refs fresh
    useEffect(() => {
        dataRef.current = data;
        onSaveRef.current = onSave;
        onConflictRef.current = onConflict;
    }, [data, onSave, onConflict]);

    // 2. SAVE FUNCTION
    const performSave = useCallback(async (dataToSave, isUnmount = false) => {
        if (isSavingRef.current && !isUnmount) return;

        isSavingRef.current = true;
        if (!isUnmount) setStatus('saving');

        try {
            await onSaveRef.current(dataToSave);

            // Update "Truth"
            setLastSavedString(JSON.stringify(dataToSave));

            if (!isUnmount) {
                console.log("Saved");
                setStatus('saved');
                setLastSaved(new Date());
                isDirtyRef.current = false;
            }
        } catch (err) {
            console.error("AutoSave failed:", err);
            if (err.status === 409 && onConflictRef.current) {
                setStatus('conflict');
                onConflictRef.current();
            } else if (!isUnmount) {
                setStatus('error');
            }
        } finally {
            isSavingRef.current = false;
        }
    }, []);

    // 3. HANDLE UNMOUNT (Navigation / Component Destruction)
    // We removed 'recordId' dependency because if ID changes, this component unmounts anyway.
    useEffect(() => {
        return () => {
            if (isDirtyRef.current && !isSavingRef.current) {
                console.log("AutoSave: Saving before unmount...");
                performSave(dataRef.current, true);
            }
        };
    }, [performSave]);

    // 4. CORE LOGIC (Debounce)
    const dataString = JSON.stringify(data);

    useEffect(() => {
        // If data hasn't changed from baseline, do nothing
        if (dataString === lastSavedString) return;

        console.log("Change detected, scheduling save...");
        isDirtyRef.current = true;
        setStatus('pending');

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

        saveTimerRef.current = setTimeout(() => {
            performSave(JSON.parse(dataString));
        }, debounceMs);

        return () => clearTimeout(saveTimerRef.current);
    }, [dataString, lastSavedString, debounceMs, performSave]);

    // 5. CTRL+S SHORTCUT
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (isDirtyRef.current && !isSavingRef.current) {
                    console.log("Ctrl+S triggered");
                    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                    performSave(JSON.parse(dataString));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dataString, performSave]);

    // 6. HANDLE TAB CLOSE (Browser Level)
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirtyRef.current && !isSavingRef.current) {
                performSave(dataRef.current, true);
                // Standard browser behavior requires these:
                e.preventDefault(); 
                e.returnValue = ''; 
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [performSave]);

    return { status, lastSaved };
}