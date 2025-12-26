import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router';
import {
    Box,
    TextField,
    Typography,
    Button,
    Paper,
    Divider,
    IconButton,
    Stack,
    List,
    ListItem,
    ListItemText,
    Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddLinkIcon from '@mui/icons-material/AddLink';
import SaveIcon from '@mui/icons-material/Save';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

export default function LessonEditor() {
    const { lessonId } = useParams();
    const { items, setItems } = useOutletContext(); // Luăm funcțiile din Layout pentru a actualiza Sidebar-ul

    // State pentru datele locale ale lecției
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [links, setLinks] = useState([]);

    // State pentru input-ul de link nou
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [newLinkLabel, setNewLinkLabel] = useState('');

    // Când se schimbă lessonId, încărcăm datele (Simulare)
    useEffect(() => {
        // 1. Găsim titlul din lista globală (sidebar)
        const currentItem = items.find(i => i.id === lessonId);
        if (currentItem) {
            setTitle(currentItem.title);
        }

        // 2. Aici ar trebui să faci fetch la backend pentru conținutul specific lecției
        // fetch(`/api/lessons/${lessonId}`)...
        // Pentru demo, resetăm sau setăm valori dummy
        setContent(`Conținut pentru lecția ${lessonId}... Poți folosi Markdown aici.`);
        setVideoUrl('');
        setLinks([
            { label: 'Documentație React', url: 'https://react.dev' }
        ]);
    }, [lessonId, items]);

    // Handler pentru schimbarea titlului (actualizează și Sidebar-ul în timp real)
    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);

        // Actualizăm lista globală pentru Sidebar
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === lessonId ? { ...item, title: newTitle } : item
            )
        );
    };

    // Handler pentru adăugarea unui link
    const handleAddLink = () => {
        if (newLinkUrl && newLinkLabel) {
            setLinks([...links, { url: newLinkUrl, label: newLinkLabel }]);
            setNewLinkUrl('');
            setNewLinkLabel('');
        }
    };

    // Handler pentru ștergerea unui link
    const handleDeleteLink = (index) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        const lessonData = {
            id: lessonId,
            title,
            content,
            videoUrl,
            links
        };
        console.log("Saving Lesson Data:", lessonData);
        // fetch('/api/lessons/update', { method: 'POST', body: ... })
        alert("Lecție salvată cu succes!");
    };

    if (!items.find(i => i.id === lessonId)) {
        return <Typography p={3}>Lecția nu a fost găsită.</Typography>;
    }

    return (
        <Box maxWidth="md" mx="auto">
            {/* Header cu Titlu și Buton Salvare */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold" color="primary">
                    Editare Lecție
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                >
                    Salvează Modificările
                </Button>
            </Stack>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Stack spacing={3}>
                    {/* 1. Titlul Lecției */}
                    <TextField
                        label="Titlu Lecție"
                        variant="outlined"
                        fullWidth
                        value={title}
                        onChange={handleTitleChange}
                        helperText="Acest titlu va apărea în bara laterală."
                    />

                    {/* 2. Video URL */}
                    <TextField
                        label="Video URL (YouTube/Vimeo)"
                        variant="outlined"
                        fullWidth
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        InputProps={{
                            startAdornment: <PlayCircleOutlineIcon color="action" sx={{ mr: 1 }} />,
                        }}
                    />

                    {/* 3. Conținut Text (Descriere) */}
                    <TextField
                        label="Conținut Lecție (Text / Markdown)"
                        multiline
                        minRows={6}
                        variant="outlined"
                        fullWidth
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Scrie aici detaliile lecției..."
                    />
                </Stack>
            </Paper>

            {/* 4. Secțiunea Link-uri și Resurse */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Resurse & Link-uri Utile
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Adaugă materiale suplimentare pentru studenți.
                </Typography>

                {/* Formular Adăugare Link */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
                    <TextField
                        label="Text Link (ex: Github Repo)"
                        size="small"
                        fullWidth
                        value={newLinkLabel}
                        onChange={(e) => setNewLinkLabel(e.target.value)}
                    />
                    <TextField
                        label="URL (https://...)"
                        size="small"
                        fullWidth
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<AddLinkIcon />}
                        onClick={handleAddLink}
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        Adaugă
                    </Button>
                </Stack>

                <Divider />

                {/* Lista Link-uri Existente */}
                <List>
                    {links.length === 0 && (
                        <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
                            Niciun link adăugat.
                        </Typography>
                    )}
                    {links.map((link, index) => (
                        <ListItem
                            key={index}
                            divider
                            // ✅ Prop on the Item itself
                            secondaryAction={
                                <IconButton edge="end" color="error" onClick={() => handleDeleteLink(index)}>
                                    <DeleteIcon />
                                </IconButton>
                            }
                        >
                            <ListItemText primary={link.label} secondary={link.url} />
                        </ListItem> 
                    ))}
                </List>
            </Paper>
        </Box>
    );
}