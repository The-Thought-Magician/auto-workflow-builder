import React from 'react';
import { Box, Paper, Typography, Avatar, Stack, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

const ChatMessage = ({ 
  message, 
  isUser = false, 
  timestamp, 
  isLoading = false,
  animate = true,
  index = 0 
}) => {
  const messageContent = (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 3,
        px: 1,
      }}
    >
      <Stack
        direction={isUser ? 'row-reverse' : 'row'}
        spacing={2}
        alignItems="flex-start"
        sx={{ maxWidth: '85%' }}
      >
        <Avatar
          sx={{
            bgcolor: isUser ? 'primary.main' : 'secondary.main',
            width: 36,
            height: 36,
            flexShrink: 0,
            ...(isUser ? {} : {
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
            })
          }}
        >
          {isUser ? (
            <PersonIcon fontSize="small" />
          ) : (
            <SmartToyIcon fontSize="small" />
          )}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              backgroundColor: isUser 
                ? 'rgba(59, 130, 246, 0.1)' 
                : 'rgba(30, 41, 59, 0.8)',
              border: `1px solid ${isUser 
                ? 'rgba(59, 130, 246, 0.2)' 
                : 'rgba(255, 255, 255, 0.1)'
              }`,
              borderRadius: isUser 
                ? '20px 20px 6px 20px' 
                : '20px 20px 20px 6px',
              backdropFilter: 'blur(12px)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: isUser 
                  ? '0 8px 25px rgba(59, 130, 246, 0.15)' 
                  : '0 8px 25px rgba(0, 0, 0, 0.2)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: isUser
                  ? 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
              }
            }}
          >
            {!isUser && !isLoading && (
              <Chip
                label="AI Assistant"
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 12,
                  height: 20,
                  fontSize: '0.625rem',
                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                  color: '#a78bfa',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  '& .MuiChip-label': {
                    px: 1,
                  }
                }}
              />
            )}

            {isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    AI is thinking...
                  </Typography>
                </motion.div>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {[0, 1, 2].map((dot) => (
                    <motion.div
                      key={dot}
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: dot * 0.2,
                        ease: 'easeInOut'
                      }}
                    >
                      <Box
                        sx={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                        }}
                      />
                    </motion.div>
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.6,
                  color: 'text.primary',
                  pr: !isUser ? 5 : 0,
                }}
              >
                {message}
              </Typography>
            )}

            {timestamp && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 1.5,
                  color: 'text.disabled',
                  textAlign: isUser ? 'right' : 'left',
                }}
              >
                {new Date(timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Typography>
            )}
          </Paper>
        </Box>
      </Stack>
    </Box>
  );

  if (!animate) {
    return messageContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.1,
        ease: [0.68, -0.55, 0.265, 1.55]
      }}
      layout
    >
      {messageContent}
    </motion.div>
  );
};

export default ChatMessage;