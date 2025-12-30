// client/src/LessonPreview.jsx
import React from 'react';
import { Box, Typography, Paper, Divider, List, ListItem, ListItemIcon, ListItemText, Link } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function LessonPreview({ title, content, videoUrl, links }) {
    const getVideoEmbed = (url) => {
        if (!url) return null;

        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            let videoId = "";
            try {
                if (url.includes("watch?v=")) videoId = url.split("watch?v=")[1].split("&")[0];
                else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split("?")[0];
                else if (url.includes("embed/")) videoId = url.split("embed/")[1];
            } catch (e) { return null; }
            if (!videoId) return null;
            return { type: 'iframe', src: `https://www.youtube.com/embed/${videoId}` };
        }

        if (url.includes("vimeo.com")) {
            const vimeoId = url.split("vimeo.com/")[1]?.split("/")[0];
            if (vimeoId) return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeoId}` };
        }

        if (url.match(/\.(mp4|webm|ogg)$/i)) {
            return { type: 'video', src: url };
        }

        return null;
    };

    const embedInfo = getVideoEmbed(videoUrl);

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', py: 4, px: 2 }}>
            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                {title || "Untitled Lesson"}
            </Typography>

            <Divider sx={{ my: 3 }} />

            {embedInfo && (
                <Paper elevation={2} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', bgcolor: '#000' }}>
                    <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                        {embedInfo.type === 'iframe' ? (
                            <iframe
                                src={embedInfo.src}
                                title="Lesson Video"
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <video
                                src={embedInfo.src}
                                controls
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            />
                        )}
                    </Box>
                </Paper>
            )}

            <Paper elevation={1} sx={{ p: 4, mb: 4 }}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ children }) => <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>{children}</Typography>,
                        h2: ({ children }) => <Typography variant="h5" component="h3" fontWeight="bold" gutterBottom sx={{ mt: 2.5 }}>{children}</Typography>,
                        h3: ({ children }) => <Typography variant="h6" component="h4" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>{children}</Typography>,
                        p: ({ children }) => <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>{children}</Typography>,
                        ul: ({ children }) => <Box component="ul" sx={{ pl: 3, my: 2 }}>{children}</Box>,
                        ol: ({ children }) => <Box component="ol" sx={{ pl: 3, my: 2 }}>{children}</Box>,
                        li: ({ children }) => <Typography component="li" variant="body1" sx={{ mb: 1 }}>{children}</Typography>,
                        code: ({ inline, children }) => inline 
                            ? <Box component="code" sx={{ bgcolor: 'grey.200', px: 1, py: 0.5, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.9em' }}>{children}</Box>
                            : <Paper component="pre" elevation={0} sx={{ bgcolor: 'grey.900', color: 'grey.100', p: 2, borderRadius: 1, overflow: 'auto', my: 2 }}><code style={{ fontFamily: 'monospace' }}>{children}</code></Paper>,
                        blockquote: ({ children }) => <Box component="blockquote" sx={{ borderLeft: 4, borderColor: 'primary.main', pl: 2, my: 2, fontStyle: 'italic', color: 'text.secondary' }}>{children}</Box>,
                        a: ({ href, children }) => <Link href={href} target="_blank" rel="noopener">{children}</Link>
                    }}
                >
                    {content || "*No content yet*"}
                </ReactMarkdown>
            </Paper>

            {links && links.length > 0 && (
                <Paper elevation={1} sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Resources & Links
                    </Typography>
                    <List>
                        {links.map((link, index) => (
                            <ListItem key={index} disablePadding>
                                <ListItemIcon>
                                    <LinkIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Link href={link.url} target="_blank" rel="noopener" underline="hover">
                                            {link.label}
                                        </Link>
                                    }
                                    secondary={link.url}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
}