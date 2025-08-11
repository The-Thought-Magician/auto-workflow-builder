import React, { useState, useEffect } from 'react';
import { Box, Text, TextInput, PasswordInput, Button, Paper } from '@mantine/core';
import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { showNotification } from '@mantine/notifications';

const SettingsPage = () => {
  const { user, token, setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const res = await axios.put(
        '/api/user/profile',
        { name, password: password || undefined },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setUser(res.data);
      showNotification({ title: 'Profile updated', message: 'Your details were saved', color: 'green' });
      setPassword('');
    } catch (err) {
      showNotification({ title: 'Error', message: err.response?.data?.message || err.message, color: 'red' });
    }
  };

  return (
    <Paper p="lg" withBorder>
      <Text size="xl" fw={600} mb="md">
        Settings
      </Text>
      <TextInput label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} mb="sm" />
      <PasswordInput
        label="New Password"
        value={password}
        onChange={(e) => setPassword(e.currentTarget.value)}
        mb="sm"
      />
      <Button onClick={handleSave}>Save</Button>
      <Box mt="lg">
        <Text fw={500}>Subscription</Text>
        <Text>{user?.subscription || 'Free'}</Text>
        <Button mt="sm" variant="outline" component="a" href="#" disabled>
          Manage Subscription (Coming soon)
        </Button>
      </Box>
    </Paper>
  );
};

export default SettingsPage;