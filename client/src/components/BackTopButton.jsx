import React from 'react';
import { Zoom, Fab, Box} from '@mui/material';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

function BackToTopButton(props) {
  const trigger = useScrollTrigger({
    disableHysteresis: true, 
    threshold: 100,          
  });

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector(
      '#back-to-top-anchor',
    );

    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Zoom in={trigger}>
      <Box
        role="presentation"
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1000, 
        }}
      >
        <Fab 
            onClick={handleClick}
            className='back-to-top-button'
            size="small" 
            aria-label="scroll back to top"
        >
          <KeyboardArrowUpIcon
            sx={{color:"white"}}  
          />
        </Fab>
      </Box>
    </Zoom>
  );
}

export default BackToTopButton;