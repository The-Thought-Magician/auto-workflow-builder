import React, { useState } from 'react';
import {
  Box,
  Table,
  Text,
  Group,
  Button,
  TextInput,
  Select,
  Modal,
  Loader,
  Menu,
  ActionIcon,
} from '@mantine/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import axios from 'axios';
import { showNotification } from '@mantine/notifications';
import { IconDotsVertical, IconCircleCheck, IconX } from '@tabler/icons-react';

const fetchCredentials = async (token) => {
  const res = await axios.get('/api/credentials', { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

const serviceOptions = [
  { value: 'slack', label: 'Slack' },
  { value: 'google', label: 'Google' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'typeform', label: 'Typeform' },
];

const CredentialsPage = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(['credentials'], () => fetchCredentials(token), {
    enabled: !!token,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [service, setService] = useState('');
  const [secret, setSecret] = useState('');
  const [testingId, setTestingId] = useState(null);

  const handleAddCredential = async () => {
    try {
      await axios.post(
        '/api/credentials',
        { service, data: { token: secret } },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showNotification({ title: 'Added', message: 'Credential saved', color: 'green' });
      setService('');
      setSecret('');
      setModalOpen(false);
      queryClient.invalidateQueries(['credentials']);
    } catch (err) {
      showNotification({ title: 'Error', message: err.response?.data?.message || err.message, color: 'red' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/credentials/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showNotification({ title: 'Deleted', message: 'Credential removed', color: 'green' });
      queryClient.invalidateQueries(['credentials']);
    } catch (err) {
      showNotification({ title: 'Error', message: err.response?.data?.message || err.message, color: 'red' });
    }
  };

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      const res = await axios.post(`/api/credentials/${id}/test`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.valid) {
        showNotification({ title: 'Success', message: 'Connection is valid', color: 'green', icon: <IconCircleCheck /> });
      } else {
        showNotification({ title: 'Failed', message: res.data.error || 'Connection failed', color: 'red', icon: <IconX /> });
      }
    } catch (err) {
      showNotification({ title: 'Error', message: err.response?.data?.message || err.message, color: 'red' });
    }
    setTestingId(null);
  };

  const rows = data?.map((cred) => (
    <tr key={cred.id}>
      <td>{cred.service}</td>
      <td>{new Date(cred.createdAt).toLocaleString()}</td>
      <td>
        <Menu withinPortal position="bottom-end" shadow="md">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDotsVertical size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => handleTest(cred.id)}>Test connection</Menu.Item>
            <Menu.Item color="red" onClick={() => handleDelete(cred.id)}>
              Revoke access
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </td>
    </tr>
  ));

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={600}>
          Credentials
        </Text>
        <Button onClick={() => setModalOpen(true)}>Add Credential</Button>
      </Group>
      {isLoading ? (
        <Loader />
      ) : (
        <Table striped highlightOnHover withBorder verticalSpacing="sm">
          <thead>
            <tr>
              <th>Service</th>
              <th>Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      )}
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Add Credential" centered>
        <Select
          label="Service"
          placeholder="Select service"
          data={serviceOptions}
          value={service}
          onChange={setService}
          mb="sm"
        />
        <TextInput
          label="Token / API Key"
          placeholder="Paste your key here"
          value={secret}
          onChange={(e) => setSecret(e.currentTarget.value)}
          mb="sm"
        />
        <Button onClick={handleAddCredential} disabled={!service || !secret} fullWidth>
          Save
        </Button>
      </Modal>
    </Box>
  );
};

export default CredentialsPage;