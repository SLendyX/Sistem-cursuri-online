// client/src/student_experience/QuizView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Card, CardContent, Typography, Button, Radio, RadioGroup,
    FormControlLabel, FormControl, LinearProgress, Alert, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Checkbox,
    FormGroup, Paper, Divider, Stack
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TimerIcon from '@mui/icons-material/Timer';
import { LoggedInContext } from '../context/LoggedInContext';

const QuizView = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showAlert } = React.useContext(LoggedInContext);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [startTime] = useState(new Date().toISOString());
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState(null);

    // Fetch quiz data
    const { data, isLoading } = useQuery({
        queryKey: ['quiz', lessonId],
        queryFn: async () => {
            const res = await fetch(`/api/quizzes/lesson/${lessonId}`);
            if (!res.ok) throw new Error("Failed to load quiz");
            return res.json();
        }
    });

    // Submit mutation
    const submitMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await fetch(`/api/quizzes/${data.quiz.id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Failed to submit quiz");
            return res.json();
        },
        onSuccess: (result) => {
            setResults(result);
            setShowResults(true);
            queryClient.invalidateQueries(['quiz', lessonId]);
            showAlert(`Quiz completed! Score: ${result.score.toFixed(1)}%`, result.passed ? "success" : "warning");
        },
        onError: (err) => {
            showAlert(err.message, "error");
        }
    });

    // Timer effect
    useEffect(() => {
        if (!data?.quiz?.timeLimit) return;

        setTimeRemaining(data.quiz.timeLimit * 60); // Convert to seconds

        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [data]);

    if (isLoading) return <Box sx={{ textAlign: 'center', mt: 4 }}><LinearProgress /></Box>;

    if (!data?.hasQuiz) {
        return (
            <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, textAlign: 'center' }}>
                <Alert severity="info">This lesson does not have a quiz.</Alert>
                <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
            </Box>
        );
    }

    const { quiz, attempts } = data;
    const currentQuestion = quiz.questions[currentIndex];
    const canRetake = quiz.maxAttempts === null || attempts.length < quiz.maxAttempts;
    const hasStarted = Object.keys(answers).length > 0;

    const handleAnswerChange = (optionId) => {
        if (currentQuestion.question_type === 'multiple_choice') {
            setAnswers(prev => {
                const current = prev[currentQuestion.id] || [];
                const newAnswers = current.includes(optionId)
                    ? current.filter(id => id !== optionId)
                    : [...current, optionId];
                return { ...prev, [currentQuestion.id]: newAnswers };
            });
        } else {
            setAnswers(prev => ({ ...prev, [currentQuestion.id]: [optionId] }));
        }
    };

    const handleNext = () => {
        if (currentIndex < quiz.questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleSubmit = () => {
        submitMutation.mutate({
            answers,
            startedAt: startTime
        });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Results View
    if (showResults && results) {
        return (
            <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, mb: 4 }}>
                <Card elevation={3}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        {results.passed ? (
                            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                        ) : (
                            <CancelIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                        )}
                        
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            {results.passed ? "Congratulations!" : "Keep Trying!"}
                        </Typography>
                        
                        <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
                            Score: {results.score.toFixed(1)}% ({results.passed ? "Passed" : "Failed"})
                        </Typography>

                        <Divider sx={{ my: 3 }} />

                        <Typography variant="body1" sx={{ mb: 3 }}>
                            Passing Score: {results.passingScore}%
                        </Typography>

                        {!results.passed && canRetake && (
                            <Button variant="contained" onClick={() => window.location.reload()} sx={{ mr: 2 }}>
                                Retry Quiz
                            </Button>
                        )}

                        <Button variant="outlined" onClick={() => navigate(-1)}>
                            Back to Lesson
                        </Button>
                    </CardContent>
                </Card>

                {/* Review Answers */}
                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Review Your Answers</Typography>
                {quiz.questions.map((q, idx) => {
                    const result = results.results.find(r => r.questionId === q.id);
                    return (
                        <Card key={q.id} sx={{ mb: 2, border: result?.isCorrect ? '2px solid green' : '2px solid red' }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        Question {idx + 1}
                                    </Typography>
                                    <Chip 
                                        label={result?.isCorrect ? "Correct" : "Incorrect"}
                                        color={result?.isCorrect ? "success" : "error"}
                                        size="small"
                                    />
                                </Stack>

                                <Typography variant="body1" sx={{ mb: 2 }}>{q.question_text}</Typography>

                                <FormControl component="fieldset" disabled>
                                    {q.question_type === 'multiple_choice' ? (
                                        <FormGroup>
                                            {q.options.map(opt => (
                                                <FormControlLabel
                                                    key={opt.id}
                                                    control={<Checkbox checked={result?.userAnswer.includes(opt.id)} />}
                                                    label={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            {opt.option_text}
                                                            {result?.correctAnswer.includes(opt.id) && 
                                                                <CheckCircleIcon fontSize="small" color="success" />
                                                            }
                                                        </Box>
                                                    }
                                                />
                                            ))}
                                        </FormGroup>
                                    ) : (
                                        <RadioGroup value={result?.userAnswer[0] || ''}>
                                            {q.options.map(opt => (
                                                <FormControlLabel
                                                    key={opt.id}
                                                    value={opt.id}
                                                    control={<Radio />}
                                                    label={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            {opt.option_text}
                                                            {result?.correctAnswer.includes(opt.id) && 
                                                                <CheckCircleIcon fontSize="small" color="success" />
                                                            }
                                                        </Box>
                                                    }
                                                />
                                            ))}
                                        </RadioGroup>
                                    )}
                                </FormControl>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        );
    }

    // Quiz Taking View
    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, mb: 4 }}>
            {/* Header */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {quiz.title}
                </Typography>
                {quiz.description && (
                    <Typography variant="body2" color="text.secondary">
                        {quiz.description}
                    </Typography>
                )}
            </Paper>

            {/* Timer & Progress */}
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="caption">
                        Question {currentIndex + 1} of {quiz.questions.length}
                    </Typography>
                    {timeRemaining !== null && (
                        <Chip 
                            icon={<TimerIcon />}
                            label={formatTime(timeRemaining)}
                            color={timeRemaining < 60 ? "error" : "default"}
                            size="small"
                        />
                    )}
                </Stack>
                <LinearProgress 
                    variant="determinate" 
                    value={((currentIndex + 1) / quiz.questions.length) * 100}
                    sx={{ height: 8, borderRadius: 1 }}
                />
            </Box>

            {/* Question Card */}
            <Card elevation={3} sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {currentQuestion.question_text}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                        {currentQuestion.question_type === 'multiple_choice' 
                            ? "Select all that apply" 
                            : "Select one answer"}
                    </Typography>

                    <FormControl component="fieldset" fullWidth>
                        {currentQuestion.question_type === 'multiple_choice' ? (
                            <FormGroup>
                                {currentQuestion.options.map(opt => (
                                    <FormControlLabel
                                        key={opt.id}
                                        control={
                                            <Checkbox 
                                                checked={(answers[currentQuestion.id] || []).includes(opt.id)}
                                                onChange={() => handleAnswerChange(opt.id)}
                                            />
                                        }
                                        label={opt.option_text}
                                    />
                                ))}
                            </FormGroup>
                        ) : (
                            <RadioGroup
                                value={answers[currentQuestion.id]?.[0] || ''}
                                onChange={(e) => handleAnswerChange(Number(e.target.value))}
                            >
                                {currentQuestion.options.map(opt => (
                                    <FormControlLabel
                                        key={opt.id}
                                        value={opt.id}
                                        control={<Radio />}
                                        label={opt.option_text}
                                    />
                                ))}
                            </RadioGroup>
                        )}
                    </FormControl>
                </CardContent>
            </Card>

            {/* Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                    disabled={currentIndex === 0}
                    onClick={handlePrev}
                >
                    Previous
                </Button>

                {currentIndex === quiz.questions.length - 1 ? (
                    <Button 
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={submitMutation.isPending}
                    >
                        {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
                    </Button>
                ) : (
                    <Button 
                        variant="contained"
                        onClick={handleNext}
                    >
                        Next
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default QuizView;