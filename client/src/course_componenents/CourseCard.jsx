// client/src/CourseCard.jsx (Updated)
// Now links to the landing page instead of player
import React from "react";
import {
  Card, CardMedia, CardContent, Typography,
  Chip, Rating, Box, Stack, Divider, Avatar
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import { NavLink } from "react-router";

export default function ({ curs, ...props }) {
  const { nume_curs, thumbnail_url, dificultate, nr_proiecte, studenti_inrolati, descriere, pret, rating, curs_id, name } = curs;

  const dificulty_color = dificultate === "usor" ? "success" : dificultate === "mediu" ? "warning" : "error"

  return (
    // ⭐ KEY CHANGE: Now links to /courses/:id instead of player
    <NavLink className="course-card-link" to={`/courses/${curs_id}`}>
      <Card sx={{
        maxWidth: 340,
        borderRadius: 2,
        boxShadow: 3,
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: 6,
          transition: 'all 0.3s ease'
        }
      }}>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Rating value={rating} precision={0.5} readOnly size="small" />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
              ({studenti_inrolati || 0})
            </Typography>
          </Box>
          <Chip label={dificultate} color={dificulty_color} size="small" />
        </Box>

        <CardMedia
          component="img"
          height="140"
          image={thumbnail_url || '/images/default.jpg'}
          alt={nume_curs}
        />

        <CardContent>
          <Typography gutterBottom variant="h5" component="div" fontWeight="bold">
            {nume_curs}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {descriere}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            divider={<Divider orientation="vertical" flexItem />}
            sx={{ mb: 2, color: 'text.secondary', fontSize: '0.875rem' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonIcon fontSize="small" /> {studenti_inrolati || 0} Students
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FolderIcon fontSize="small" /> {nr_proiecte || 0} Projects
            </Box>
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                {name?.[0] || '?'}
              </Avatar>
              <Typography
                variant="subtitle2"
                component={NavLink}
                to={`/instructor/${curs.autor_id}`}
                sx={{
                  textDecoration: 'none',
                  color: 'text.primary',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'primary.main'
                  }
                }}
              >
                By {name || 'Unknown'}
              </Typography>
            </Box>  
            <Typography variant="h6" color="primary" fontWeight="bold">
              {pret > 0 ? `$${pret}` : "Free"}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </NavLink>
  )
}