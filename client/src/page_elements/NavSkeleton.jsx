import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

const NavSkeleton = () => {
  // Create an array of 3-4 items to mimic your linkArray
  const placeholders = [1, 2, 3];

  return (
    <Box sx={{ display: 'flex', gap: 1 }}> 
      {placeholders.map((item) => (
        <Skeleton 
          key={item}
          variant="rectangular" 
          width={80} 
          height={36} 
          sx={{ borderRadius: 1 }} 
        />
      ))}
    </Box>
  );
};

export default NavSkeleton;