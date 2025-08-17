import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { motion } from 'framer-motion';

const SectionHeader = ({ 
  title, 
  subtitle, 
  children, 
  actions, 
  variant = 'h4',
  animate = true,
  ...props 
}) => {
  const content = (
    <Box sx={{ mb: 3 }} {...props}>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: subtitle ? 1 : 0 }}
      >
        <Box>
          <Typography 
            variant={variant}
            component="h1"
            sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 0.5
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ maxWidth: { xs: '100%', md: '60ch' } }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {(actions || children) && (
          <Stack 
            direction="row" 
            spacing={1}
            sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
          >
            {actions}
            {children}
          </Stack>
        )}
      </Stack>
    </Box>
  );

  if (!animate) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4,
        ease: [0.68, -0.55, 0.265, 1.55]
      }}
    >
      {content}
    </motion.div>
  );
};

export default SectionHeader;