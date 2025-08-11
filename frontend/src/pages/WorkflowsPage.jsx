import React from 'react';
import {
  Box,
  Table,
  Text,
  Menu,
  ActionIcon,
  Group,
  Switch,
  Loader,
  Anchor,
  Button,
} from '@mantine/core';
import { IconDotsVertical, IconPlayerPlay, IconPencil, IconTrash, IconCopy, IconHistory } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { showNotification } from '@mantine/notifications';

const fetchWorkflows = async (token) => {
  const res = await axios.get('/api/workflows', { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

const WorkflowsPage = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useQuery(['workflows'], () => fetchWorkflows(token), {
    enabled: !!token,
  });

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/workflows/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showNotification({ title: 'Deleted', message: 'Workflow removed', color: 'green' });
      refetch();
    } catch (err) {
      showNotification({ title: 'Error', message: err.response?.data?.message || err.message, color: 'red' });
    }
  };

  const handleRun = async (id) => {
    try {
      await axios.post(`/api/workflows/${id}/run`, {}, { headers: { Authorization: `Bearer ${token}` } });
      showNotification({ title: 'Execution started', message: 'Workflow is running', color: 'blue' });
    } catch (err) {
      showNotification({ title: 'Error', message: err.response?.data?.message || err.message, color: 'red' });
    }
  };

  const rows = data?.map((wf) => (
    <tr key={wf.id}>
      <td>
        <Anchor component="button" size="sm" onClick={() => navigate(`/workflows/${wf.id}`)}>
          {wf.name}
        </Anchor>
      </td>
      <td>
        <Switch
          size="md"
          checked={wf.status}
          onChange={async (event) => {
            const newStatus = event.currentTarget.checked;
            try {
              await axios.put(
                `/api/workflows/${wf.id}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } },
              );
              showNotification({ title: 'Updated', message: 'Workflow status updated', color: 'green' });
              queryClient.invalidateQueries(['workflows']);
            } catch (err) {
              showNotification({ title: 'Error', message: err.response?.data?.message || err.message, color: 'red' });
            }
          }}
        />
      </td>
      <td>{dayjs(wf.updatedAt).format('YYYY-MM-DD HH:mm')}</td>
      <td>{dayjs(wf.createdAt).format('YYYY-MM-DD HH:mm')}</td>
      <td>
        <Menu withinPortal position="bottom-end" shadow="md">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDotsVertical size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconPencil size={16} />} onClick={() => navigate(`/workflows/${wf.id}`)}>
              View / Edit
            </Menu.Item>
            <Menu.Item leftSection={<IconPlayerPlay size={16} />} onClick={() => handleRun(wf.id)}>
              Run manually
            </Menu.Item>
            <Menu.Item leftSection={<IconCopy size={16} />} disabled>
              Clone (coming soon)
            </Menu.Item>
            <Menu.Item leftSection={<IconHistory size={16} />} onClick={() => navigate(`/workflows/${wf.id}?tab=history`)}>
              View history
            </Menu.Item>
            <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={() => handleDelete(wf.id)}>
              Delete
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
          Workflows
        </Text>
        <Button onClick={() => navigate('/workflows/new')} disabled>
          New Workflow
        </Button>
      </Group>
      {isLoading ? (
        <Loader />
      ) : (
        <Table striped highlightOnHover withBorder verticalSpacing="sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      )}
    </Box>
  );
};

export default WorkflowsPage;