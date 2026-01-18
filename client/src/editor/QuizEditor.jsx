// client/src/editor/QuizEditor.jsx
import React, { useState } from 'react';
import { useParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Paper, Typography, TextField, Button, IconButton, Card, CardContent,
    FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
    Stack, Divider, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
    Accordion, AccordionSummary, AccordionDetails, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { LoggedInContext } from '../context/LoggedInContext';

const QuizEditor = () => {
    const { lessonId } = useParams();
    const queryClient = useQueryClient();
    const { showAlert } = React.useContext(LoggedInContext);

    const [quizSettings, setQuizSettings] = useState({
        title: '',
        description: '',
        timeLimit: null,
        passingScore: 70,
        maxAttempts: null,
        isPublished: false
    });

    const [editingQuestion, setEditingQuestion] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, questionId: null });

    // Fetch quiz
    const { data: quiz, isLoading } = useQuery({
        queryKey: ['instructor-quiz', lessonId],
        queryFn: async () => {
            // First check if quiz exists
            const checkRes = await fetch(`/api/quizzes/lesson/${lessonId}`);
            const checkData = await checkRes.json();
            
            if (!checkData.hasQuiz) {
                return null;
            }

            // Fetch full quiz with ownership
            const res = await fetch(`/api/author/quizzes/${checkData.quiz.id}`);
            if (!res.ok) throw new Error("Failed to load quiz");
            return res.json();
        },
        onSuccess: (data) => {
            if (data) {
                setQuizSettings({
                    title: data.title,
                    description: data.description || '',
                    timeLimit: data.time_limit,
                    passingScore: data.passing_score,
                    maxAttempts: data.max_attempts,
                    isPublished: Boolean(data.is_published)
                });
            }
        }
    });

    // Create quiz mutation
    const createQuizMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/author/quizzes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, ...quizSettings })
            });
            if (!res.ok) throw new Error("Failed to create quiz");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['instructor-quiz', lessonId]);
            showAlert("Quiz created successfully!", "success");
        }
    });

    // Update quiz mutation
    const updateQuizMutation = useMutation({
        mutationFn: async (updates) => {
            const res = await fetch(`/api/author/quizzes/${quiz.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...updates, version: quiz.version })
            });
            if (!res.ok) throw new Error("Failed to update quiz");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['instructor-quiz', lessonId]);
            showAlert("Quiz updated!", "success");
        }
    });

    // Add question mutation
    const addQuestionMutation = useMutation({
        mutationFn: async (questionData) => {
            const res = await fetch(`/api/author/quizzes/${quiz.id}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(questionData)
            });
            if (!res.ok) throw new Error("Failed to add question");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['instructor-quiz', lessonId]);
            showAlert("Question added!", "success");
            setEditingQuestion(null);
        }
    });

    // Update question mutation
    const updateQuestionMutation = useMutation({
        mutationFn: async ({ questionId, data }) => {
            const res = await fetch(`/api/author/questions/${questionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to update question");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['instructor-quiz', lessonId]);
            showAlert("Question updated!", "success");
            setEditingQuestion(null);
        }
    });

    // Delete question mutation
    const deleteQuestionMutation = useMutation({
        mutationFn: async (questionId) => {
            const res = await fetch(`/api/author/questions/${questionId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error("Failed to delete question");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['instructor-quiz', lessonId]);
            showAlert("Question deleted!", "success");
            setDeleteDialog({ open: false, questionId: null });
        }
    });

    const handleSaveSettings = () => {
        updateQuizMutation.mutate(quizSettings);
    };

    const handleAddQuestion = () => {
        setEditingQuestion({
            questionText: '',
            questionType: 'single_choice',
            points: 1,
            options: [
                { text: '', isCorrect: false },
                { text: '', isCorrect: false }
            ]
        });
    };

    const handleSaveQuestion = () => {
        if (editingQuestion.id) {
            updateQuestionMutation.mutate({
                questionId: editingQuestion.id,
                data: editingQuestion
            });
        } else {
            addQuestionMutation.mutate(editingQuestion);
        }
    };

    if (isLoading) return <Typography>Loading...</Typography>;

    // No quiz exists
    if (!quiz) {
        return (
            <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                        No Quiz Created Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Add a quiz to this lesson to test your students' knowledge.
                    </Typography>
                    <Button 
                        variant="contained" 
                        onClick={() => createQuizMutation.mutate()}
                        disabled={createQuizMutation.isPending}
                    >
                        Create Quiz
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', mb: 4 }}>
            {/* Settings Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Quiz Settings
                </Typography>

                <Stack spacing={2}>
                    <TextField
                        label="Quiz Title"
                        value={quizSettings.title}
                        onChange={(e) => setQuizSettings(prev => ({ ...prev, title: e.target.value }))}
                        fullWidth
                    />

                    <TextField
                        label="Description"
                        value={quizSettings.description}
                        onChange={(e) => setQuizSettings(prev => ({ ...prev, description: e.target.value }))}
                        multiline
                        rows={2}
                        fullWidth
                    />

                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Time Limit (minutes)"
                            type="number"
                            value={quizSettings.timeLimit || ''}
                            onChange={(e) => setQuizSettings(prev => ({ 
                                ...prev, 
                                timeLimit: e.target.value ? Number(e.target.value) : null 
                            }))}
                            helperText="Leave empty for no limit"
                            fullWidth
                        />

                        <TextField
                            label="Passing Score (%)"
                            type="number"
                            value={quizSettings.passingScore}
                            onChange={(e) => setQuizSettings(prev => ({ 
                                ...prev, 
                                passingScore: Number(e.target.value) 
                            }))}
                            fullWidth
                        />

                        <TextField
                            label="Max Attempts"
                            type="number"
                            value={quizSettings.maxAttempts || ''}
                            onChange={(e) => setQuizSettings(prev => ({ 
                                ...prev, 
                                maxAttempts: e.target.value ? Number(e.target.value) : null 
                            }))}
                            helperText="Leave empty for unlimited"
                            fullWidth
                        />
                    </Stack>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={quizSettings.isPublished}
                                onChange={(e) => setQuizSettings(prev => ({ 
                                    ...prev, 
                                    isPublished: e.target.checked 
                                }))}
                            />
                        }
                        label="Published (Visible to students)"
                    />

                    <Button 
                        variant="contained" 
                        onClick={handleSaveSettings}
                        disabled={updateQuizMutation.isPending}
                    >
                        Save Settings
                    </Button>
                </Stack>
            </Paper>

            {/* Questions Section */}
            <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Questions ({quiz.questions?.length || 0})
                    </Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />}
                        onClick={handleAddQuestion}
                    >
                        Add Question
                    </Button>
                </Box>

                {quiz.questions?.map((q, index) => (
                    <Accordion key={q.id} sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                                <Typography fontWeight="bold">Q{index + 1}</Typography>
                                <Typography sx={{ flex: 1 }}>{q.question_text}</Typography>
                                <Chip label={q.question_type} size="small" />
                                <Chip label={`${q.points} pts`} size="small" color="primary" />
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={1}>
                                {q.options.map((opt, optIdx) => (
                                    <Box key={opt.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {opt.is_correct && <CheckCircleIcon color="success" fontSize="small" />}
                                        <Typography variant="body2">
                                            {String.fromCharCode(65 + optIdx)}. {opt.option_text}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>

                            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                <Button 
                                    size="small" 
                                    onClick={() => setEditingQuestion(q)}
                                >
                                    Edit
                                </Button>
                                <Button 
                                    size="small" 
                                    color="error"
                                    onClick={() => setDeleteDialog({ open: true, questionId: q.id })}
                                >
                                    Delete
                                </Button>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Paper>

            {/* Question Editor Dialog */}
            <Dialog 
                open={Boolean(editingQuestion)} 
                onClose={() => setEditingQuestion(null)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {editingQuestion?.id ? "Edit Question" : "Add New Question"}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Question Text"
                            value={editingQuestion?.questionText || ''}
                            onChange={(e) => setEditingQuestion(prev => ({ 
                                ...prev, 
                                questionText: e.target.value 
                            }))}
                            multiline
                            rows={2}
                            fullWidth
                        />

                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Question Type</InputLabel>
                                <Select
                                    value={editingQuestion?.questionType || 'single_choice'}
                                    onChange={(e) => setEditingQuestion(prev => ({ 
                                        ...prev, 
                                        questionType: e.target.value 
                                    }))}
                                    label="Question Type"
                                >
                                    <MenuItem value="single_choice">Single Choice</MenuItem>
                                    <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                                    <MenuItem value="true_false">True/False</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                label="Points"
                                type="number"
                                value={editingQuestion?.points || 1}
                                onChange={(e) => setEditingQuestion(prev => ({ 
                                    ...prev, 
                                    points: Number(e.target.value) 
                                }))}
                                sx={{ width: 120 }}
                            />
                        </Stack>

                        <Divider />

                        <Typography variant="subtitle2">Answer Options</Typography>

                        {editingQuestion?.options?.map((opt, idx) => (
                            <Stack key={idx} direction="row" spacing={1} alignItems="center">
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={opt.isCorrect}
                                            onChange={(e) => {
                                                const newOptions = [...editingQuestion.options];
                                                newOptions[idx].isCorrect = e.target.checked;
                                                setEditingQuestion(prev => ({ ...prev, options: newOptions }));
                                            }}
                                        />
                                    }
                                    label="Correct"
                                />
                                <TextField
                                    placeholder={`Option ${idx + 1}`}
                                    value={opt.text}
                                    onChange={(e) => {
                                        const newOptions = [...editingQuestion.options];
                                        newOptions[idx].text = e.target.value;
                                        setEditingQuestion(prev => ({ ...prev, options: newOptions }));
                                    }}
                                    fullWidth
                                />
                                <IconButton 
                                    onClick={() => {
                                        const newOptions = editingQuestion.options.filter((_, i) => i !== idx);
                                        setEditingQuestion(prev => ({ ...prev, options: newOptions }));
                                    }}
                                    disabled={editingQuestion.options.length <= 2}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Stack>
                        ))}

                        <Button
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setEditingQuestion(prev => ({
                                    ...prev,
                                    options: [...prev.options, { text: '', isCorrect: false }]
                                }));
                            }}
                        >
                            Add Option
                        </Button>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingQuestion(null)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSaveQuestion}
                        disabled={!editingQuestion?.questionText || editingQuestion.options.length < 2}
                    >
                        Save Question
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, questionId: null })}>
                <DialogTitle>Delete Question?</DialogTitle>
                <DialogContent>
                    <Typography>This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, questionId: null })}>Cancel</Button>
                    <Button 
                        color="error" 
                        onClick={() => deleteQuestionMutation.mutate(deleteDialog.questionId)}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default QuizEditor;