import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.1), transparent 70%), #0f172a',
        position: 'relative',
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: '8rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 2,
              }}
            >
              404
            </Typography>
            
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
              Page Not Found
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              The page you're looking for doesn't exist or has been moved.
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                px: 4,
                py: 1.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                },
              }}
            >
              Go Home
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default NotFoundPage;