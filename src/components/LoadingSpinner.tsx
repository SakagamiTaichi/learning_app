import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "読み込み中...", 
  size = 40 
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        gap: 2,
      }}
    >
      <CircularProgress size={size} color="primary" />
      <Typography 
        variant="body1" 
        color="text.secondary"
        sx={{ fontWeight: 'medium' }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;