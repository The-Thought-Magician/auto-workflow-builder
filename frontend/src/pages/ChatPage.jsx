import React, { useState, useRef } from 'react';
import {
  Box,
  Textarea,
  Button,
  Paper,
  ScrollArea,
  Text,
  Group,
  Loader,
  Alert,
  Badge,
  Stack
} from '@mantine/core';
import { IconCheck, IconAlertCircle, IconBolt } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { motion } from 'framer-motion';
import CredentialRequestCard from '../components/CredentialRequestCard';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I can help you build automations. Describe your workflow and I will set it up. For example, you could say:\n\n"When a customer submits a Typeform, get the data, ask GPT-4 to summarize it, and then post that summary in our \'New Leads\' Slack channel."',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState([]);
  const { token } = useAuthStore();
  const scrollRef = useRef(null);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const newMessages = [...messages, { role: 'user', content: trimmed }];
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
      const assistantMessage = { role: 'assistant', content: reply };
      setMessages((msgs) => [...msgs, assistantMessage]);
      
      // Handle function results
      if (functionResults && functionResults.length > 0) {
        handleFunctionResults(functionResults);
      }
      
      setLoading(false);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      showNotification({ 
        title: 'Chat error', 
        message: err.response?.data?.message || err.message, 
        color: 'red' 
      });
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
          showNotification({
            title: 'Workflow Created!',
            message: result.data.message,
            color: 'green',
            icon: <IconCheck />
          });
          break;
          
        case 'explanation':
          // Explanation is already included in the assistant message
          break;
          
        case 'error':
          showNotification({
            title: 'Error',
            message: result.data.message,
            color: 'red',
            icon: <IconAlertCircle />
          });
          break;
      }
    });
  };

  const handleCredentialAdded = (service) => {
    // Remove from pending credentials
    setPendingCredentials(prev => prev.filter(cred => cred.service !== service));
    
    showNotification({
      title: 'Credentials Added',
      message: `${service} credentials have been saved. You can now continue creating workflows!`,
      color: 'green',
      icon: <IconCheck />
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Stack spacing="md">
      <Paper shadow="sm" radius="md" p="md" sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
        <ScrollArea viewportRef={scrollRef} style={{ flex: 1 }}>
          <Box>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.02 }}
              >
                <Box
                  mb="sm"
                  sx={(theme) => ({
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    backgroundColor: msg.role === 'user' ? theme.colors.blue[6] : theme.colors.dark[5],
                    color: msg.role === 'user' ? theme.white : theme.white,
                    padding: theme.spacing.sm,
                    borderRadius: 8,
                    whiteSpace: 'pre-wrap',
                  })}
                >
                  <Text size="sm">{msg.content}</Text>
                </Box>
              </motion.div>
            ))}
            {loading && (
              <Group justify="center">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">Creating your workflow...</Text>
              </Group>
            )}
          </Box>
        </ScrollArea>
        <Box mt="md">
          <Textarea
            placeholder="Describe the workflow you'd like to create..."
            autosize
            minRows={2}
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
          />
          <Group justify="space-between" mt="xs">
            <Badge color="blue" variant="light" leftSection={<IconBolt size={12} />}>
              AI-Powered Workflow Builder
            </Badge>
            <Button 
              onClick={sendMessage} 
              disabled={loading || input.trim() === ''}
              loading={loading}
            >
              {loading ? 'Creating...' : 'Send'}
            </Button>
          </Group>
        </Box>
      </Paper>

      {/* Credential Request Cards */}
      {pendingCredentials.length > 0 && (
        <Box>
          <Text size="lg" fw={500} mb="md">
            Required Service Connections
          </Text>
          {pendingCredentials.map((credReq, idx) => (
            <CredentialRequestCard
              key={`${credReq.service}-${idx}`}
              service={credReq.service}
              message={credReq.message}
              requirements={credReq.requirements}
              onCredentialAdded={handleCredentialAdded}
            />
          ))}
        </Box>
      )}
    </Stack>
  );
};

export default ChatPage;