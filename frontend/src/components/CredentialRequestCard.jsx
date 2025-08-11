import React, { useState } from 'react';
import {
  Card,
  Title,
  Text,
  Button,
  TextInput,
  Group,
  Stack,
  Alert,
  Loader,
  Badge,
  List,
  ThemeIcon
} from '@mantine/core';
import { IconKey, IconBrandGoogle, IconBrandSlack, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { motion } from 'framer-motion';

const CredentialRequestCard = ({ 
  service, 
  message, 
  requirements, 
  onCredentialAdded 
}) => {
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const { token } = useAuthStore();

  const getServiceIcon = (service) => {
    switch (service) {
      case 'openai':
        return <IconKey size={24} />;
      case 'gmail':
      case 'google-sheets':
        return <IconBrandGoogle size={24} />;
      case 'slack':
        return <IconBrandSlack size={24} />;
      default:
        return <IconKey size={24} />;
    }
  };

  const getServiceColor = (service) => {
    switch (service) {
      case 'openai':
        return 'green';
      case 'gmail':
      case 'google-sheets':
        return 'blue';
      case 'slack':
        return 'violet';
      case 'typeform':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const handleApiKeySubmit = async () => {
    if (!apiKey.trim()) {
      showNotification({
        title: 'Error',
        message: 'Please enter your API key',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/credentials', {
        service,
        data: { apiKey: apiKey.trim() },
        validate: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showNotification({
        title: 'Success',
        message: response.data.message,
        color: 'green'
      });

      setApiKey('');
      onCredentialAdded(service);
    } catch (error) {
      showNotification({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to save credentials',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthConnect = async () => {
    setLoading(true);
    try {
      // For demo purposes, we'll simulate OAuth success
      // In a real implementation, this would open OAuth flow
      showNotification({
        title: 'OAuth Implementation',
        message: `OAuth flow for ${service} would open here. For now, use the API key method.`,
        color: 'blue'
      });
    } catch (error) {
      showNotification({
        title: 'Error',
        message: 'OAuth connection failed',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        shadow="sm" 
        padding="lg" 
        radius="md" 
        withBorder
        style={{ marginBottom: 16, maxWidth: '600px' }}
      >
        <Group justify="space-between" mb="md">
          <Group>
            <ThemeIcon color={getServiceColor(service)} size="lg" radius="md">
              {getServiceIcon(service)}
            </ThemeIcon>
            <div>
              <Title order={4}>Connect {requirements?.name || service}</Title>
              <Badge color={getServiceColor(service)} size="sm">
                {requirements?.type === 'oauth' ? 'OAuth' : 'API Key'} Required
              </Badge>
            </div>
          </Group>
        </Group>

        <Text size="sm" c="dimmed" mb="md">
          {message}
        </Text>

        {requirements?.description && (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" mb="md">
            {requirements.description}
          </Alert>
        )}

        {requirements?.type === 'api_key' && requirements?.instructions && (
          <Stack spacing="xs" mb="md">
            <Text size="sm" fw={500}>Setup Instructions:</Text>
            <List size="sm" spacing="xs">
              {requirements.instructions.map((instruction, index) => (
                <List.Item key={index} icon={
                  <ThemeIcon color="blue" size={18} radius="xl">
                    <Text size="xs">{index + 1}</Text>
                  </ThemeIcon>
                }>
                  {instruction}
                </List.Item>
              ))}
            </List>
          </Stack>
        )}

        <Stack spacing="md">
          {requirements?.type === 'api_key' ? (
            <div>
              <TextInput
                label={`${requirements?.name || service} API Key`}
                placeholder="Enter your API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.currentTarget.value)}
                type="password"
                disabled={loading}
              />
              <Group justify="flex-end" mt="md">
                <Button
                  onClick={handleApiKeySubmit}
                  loading={loading}
                  disabled={!apiKey.trim()}
                >
                  Save Credentials
                </Button>
              </Group>
            </div>
          ) : (
            <div>
              <Text size="sm" mb="md">
                Click the button below to connect your {requirements?.name || service} account:
              </Text>
              <Group justify="center">
                <Button
                  onClick={handleOAuthConnect}
                  loading={loading}
                  leftSection={getServiceIcon(service)}
                  color={getServiceColor(service)}
                >
                  Connect {requirements?.name || service}
                </Button>
              </Group>
            </div>
          )}
        </Stack>
      </Card>
    </motion.div>
  );
};

export default CredentialRequestCard;