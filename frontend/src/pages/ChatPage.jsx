import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Stack,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Divider
} from '@mui/material';
import { 
  Send as SendIcon,
  AutoAwesome as AutoAwesomeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuthStore } from '../store/auth';
import ChatMessage from '../components/chat/ChatMessage';
import CredentialRequestCard from '../components/CredentialRequestCard';
import SectionHeader from '../components/common/SectionHeader';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I can help you build automations. Describe your workflow and I will set it up. For example, you could say:\n\n"When a customer submits a Typeform, get the data, ask GPT-4 to summarize it, and then post that summary in our \'New Leads\' Slack channel."',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const { token } = useAuthStore();
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const newMessage = { 
      role: 'user', 
      content: trimmed,
      timestamp: new Date()
    };
    
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    
    try {
      const res = await axios.post(
        '/api/chat',
        { messages: newMessages.map((m) => ({ role: m.role, content: m.content })) },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      
      const { choices, functionResults } = res.data;
      const reply = choices?.[0]?.message?.content || 'Sorry, I did not understand.';
      
      // Add assistant message
      const assistantMessage = { 
        role: 'assistant', 
        content: reply,
        timestamp: new Date()
      };
      setMessages((msgs) => [...msgs, assistantMessage]);
      
      // Handle function results
      if (functionResults && functionResults.length > 0) {
        handleFunctionResults(functionResults);
      }
      
    } catch (err) {
      console.error('Chat error:', err);
      showNotification(err.response?.data?.message || 'Failed to send message. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFunctionResults = (results) => {
    results.forEach(result => {
      switch (result.type) {
        case 'credential_request':
          // Add to pending credentials
          setPendingCredentials(prev => {
            const exists = prev.find(cred => cred.service === result.data.service);
            if (!exists) {
              return [...prev, result.data];
            }
            return prev;
          });
          break;
          
        case 'workflow_created':
          showNotification(result.data.message, 'success');
          break;
          
        case 'explanation':
          // Explanation is already included in the assistant message
          break;
          
        case 'error':
          showNotification(result.data.message, 'error');
          break;
      }
    });
  };

  const handleCredentialAdded = (service) => {
    // Remove from pending credentials
    setPendingCredentials(prev => prev.filter(cred => cred.service !== service));
    
    showNotification(
      `${service} credentials have been saved. You can now continue creating workflows!`, 
      'success'
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <SectionHeader
        title="AI Workflow Builder"
        subtitle="Describe your automation needs in natural language and I'll build it for you"
        animate={true}
      />

      {/* Main Chat Container */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
          mb: 2
        }}
      >
        {/* Chat Messages Area */}
        <Box
          ref={scrollRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.05)',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 3,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              },
            },
          }}
        >
          {messages.map((msg, idx) => (
            <ChatMessage
              key={idx}
              message={msg.content}
              isUser={msg.role === 'user'}
              timestamp={msg.timestamp}
              index={idx}
            />
          ))}
          
          {loading && (
            <ChatMessage
              message=""
              isUser={false}
              isLoading={true}
            />
          )}
          
          <div ref={messagesEndRef} />
        </Box>

        {/* Chat Input */}
        <Box 
          sx={{ 
            p: 3, 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(51, 65, 85, 0.3)'
          }}
        >
          <Stack spacing={2}>
            <TextField
              multiline
              maxRows={4}
              placeholder="Describe the workflow you'd like to create..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  '&:hover': {
                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  },
                },
              }}
            />
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={2}
            >
              <Chip
                icon={<AutoAwesomeIcon sx={{ fontSize: 18 }} />}
                label="AI-Powered Workflow Builder"
                size="small"
                sx={{
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: 'primary.light',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  alignSelf: { xs: 'flex-start', sm: 'center' }
                }}
              />
              
              <Button
                onClick={sendMessage}
                disabled={loading || input.trim() === ''}
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
                sx={{
                  minWidth: 120,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                  },
                  '&:disabled': {
                    background: 'rgba(59, 130, 246, 0.3)',
                  }
                }}
              >
                {loading ? 'Creating...' : 'Send'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      {/* Credential Request Cards */}
      {pendingCredentials.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box sx={{ mb: 2 }}>
            <Stack spacing={2}>
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: 'warning.main',
                      animation: 'pulse 2s infinite'
                    }} 
                  />
                  Required Service Connections
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect these services to complete your workflow setup
                </Typography>
              </Box>
              
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              
              <Stack spacing={2}>
                {pendingCredentials.map((credReq, idx) => (
                  <CredentialRequestCard
                    key={`${credReq.service}-${idx}`}
                    service={credReq.service}
                    message={credReq.message}
                    requirements={credReq.requirements}
                    onCredentialAdded={handleCredentialAdded}
                  />
                ))}
              </Stack>
            </Stack>
          </Box>
        </motion.div>
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatPage;