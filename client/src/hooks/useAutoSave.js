// client/src/hooks/useAutoSave.js
import { useState, useEffect, useRef, useCallback } from 'react';

export default function useAutoSave({ data, onSave, isLoaded = true, debounceMs = 1500 }) {
    const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
    const [lastSaved, setLastSaved] = useState(null);
    
    // Refs hold the latest values for the save function to use
    const dataRef = useRef(data);
    const onSaveRef = useRef(onSave);
    const isDirtyRef = useRef(false);
    const controllerRef = useRef(null);
    const requestSeqRef = useRef(0);

    // Keep refs synchronized
    useEffect(() => {
        dataRef.current = data;
        onSaveRef.current = onSave;
    }, [data, onSave]);

    const triggerSave = useCallback(async () => {
        if (!isDirtyRef.current || !isLoaded) return;

        const dataToSave = dataRef.current;
        const seq = ++requestSeqRef.current;

        // Abort any in-flight request before starting a new one
        if (controllerRef.current) controllerRef.current.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        setSaveStatus('saving');
        
        try {
            await onSaveRef.current(dataToSave, { signal: controller.signal });
            if (seq !== requestSeqRef.current) return; // Ignore stale response
            setSaveStatus('saved');
            setLastSaved(new Date());
            isDirtyRef.current = false;
        } catch (error) {
            if (error?.name === 'AbortError') return; // Expected when superseded
            console.error("Auto-save failed:", error);
            setSaveStatus('error');
        }
    }, [isLoaded]);

    // 1. AUTO-SAVE TRIGGER (Fixed Infinite Loop)
    // We stringify the data to compare CONTENT, not object REFERENCE.
    // This prevents loops when the parent component re-renders.
    const dataString = JSON.stringify(data);

    useEffect(() => {
        if (!isLoaded) return;
        
        // If the data content is exactly the same as the last successful save, don't trigger.
        // (Optional optimization: You can add a ref to store 'lastSavedString' if needed, 
        // but checking dirty + debounce is usually enough if we rely on dataString dependency)
        
        isDirtyRef.current = true;
        
        const timer = setTimeout(() => {
            triggerSave();
        }, debounceMs);

        return () => clearTimeout(timer);
    // CRITICAL FIX: Depend on 'dataString', not 'data' object.
    }, [dataString, isLoaded, debounceMs, triggerSave]); 


    // 2. Save on Unmount / Navigation
    useEffect(() => {
        return () => {
            controllerRef.current?.abort();
            if (isDirtyRef.current) triggerSave(); 
        };
    }, [triggerSave]);

    // 3. Save on Tab Close
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirtyRef.current) {
                triggerSave();
                e.preventDefault();
                e.returnValue = ''; 
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [triggerSave]);

    // 4. Save on Tab Switch
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && isDirtyRef.current) {
                triggerSave();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [triggerSave]);

    return { saveStatus, lastSaved };
}