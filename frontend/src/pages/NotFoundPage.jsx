import React from 'react';
import { Box, Text, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text size="xl" weight={700} mb="md">
        404 - Page Not Found
      </Text>
      <Button onClick={() => navigate('/')}>Go home</Button>
    </Box>
  );
};

export default NotFoundPage;