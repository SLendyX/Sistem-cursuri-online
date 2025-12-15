import React from "react";
import { 
  Card, CardMedia, CardContent, Typography, 
  Chip, Rating, Box, Stack, Divider, Avatar 
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';

export default function({curs, ...props}){
    const { nume_curs, thumbnail_url, dificultate, nr_proiecte, studenti_inrolati, descriere, pret, rating, autor_id } = curs;

    const dificulty_color = dificultate === "usor" ? "success" : dificultate === "mediu" ? "warning" : "error"

    return (
    <Card sx={{ maxWidth: 340, borderRadius: 2, boxShadow: 3 }}>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Rating value={rating} precision={0.5} readOnly size="small" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
            (24)
          </Typography>
        </Box>
        <Chip label={dificultate} color={dificulty_color} size="small" />
      </Box>


      <CardMedia
        component="img"
        height="140"
        image={thumbnail_url}
        alt="Piano course"
      />

      <CardContent>
        <Typography gutterBottom variant="h5" component="div" fontWeight="bold">
          {nume_curs}
        </Typography>
        <Typography variant="body2" color="text.secondary">
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
            <PersonIcon fontSize="small" /> {studenti_inrolati} Students
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FolderIcon fontSize="small" /> {nr_proiecte} Projects
          </Box>
        </Stack>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>A</Avatar>
            <Typography variant="subtitle2">By {autor_id}</Typography>
          </Box>
          <Typography variant="h6" color="primary" fontWeight="bold">
            ${pret}
          </Typography>
        </Box>

      </CardContent>
    </Card>
    )
}