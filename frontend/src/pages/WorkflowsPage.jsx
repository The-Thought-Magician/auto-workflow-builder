import React, { useState } from 'react';
import {
  Box,
  Switch,
  Button,
  Snackbar,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { 
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as CopyIcon,
  History as HistoryIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import SectionHeader from '../components/common/SectionHeader';
import DataTable from '../components/common/DataTable';

const fetchWorkflows = async (token) => {
  const res = await axios.get('/api/workflows', { 
    headers: { Authorization: `Bearer ${token}` } 
  });
  return res.data;
};

const WorkflowsPage = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, workflow: null });
  
  const { data: workflows = [], isLoading, refetch } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => fetchWorkflows(token),
    enabled: !!token,
  });

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleDelete = async (workflow) => {
    try {
      await axios.delete(`/api/workflows/${workflow.id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      showNotification(`Workflow "${workflow.name}" deleted successfully`, 'success');
      refetch();
      setDeleteDialog({ open: false, workflow: null });
    } catch (err) {
      console.error('Delete workflow error:', err);
      showNotification(
        err.response?.data?.message || 'Failed to delete workflow', 
        'error'
      );
    }
  };

  const handleRun = async (workflow) => {
    try {
      await axios.post(`/api/workflows/${workflow.id}/run`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      showNotification(`Workflow "${workflow.name}" execution started`, 'info');
    } catch (err) {
      console.error('Run workflow error:', err);
      showNotification(
        err.response?.data?.message || 'Failed to run workflow', 
        'error'
      );
    }
  };

  const handleToggleStatus = async (workflow) => {
    try {
      const newStatus = !workflow.active;
      await axios.patch(`/api/workflows/${workflow.id}`, 
        { active: newStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showNotification(
        `Workflow ${newStatus ? 'activated' : 'deactivated'}`, 
        'success'
      );
      refetch();
    } catch (err) {
      console.error('Toggle workflow status error:', err);
      showNotification(
        err.response?.data?.message || 'Failed to update workflow status', 
        'error'
      );
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => (
        <Button
          variant="text"
          onClick={() => navigate(`/workflows/${row.id}`)}
          sx={{ 
            justifyContent: 'flex-start',
            textTransform: 'none',
            fontWeight: 500,
            color: 'text.primary',
            '&:hover': {
              color: 'primary.main',
              backgroundColor: 'rgba(59, 130, 246, 0.08)'
            }
          }}
        >
          {value}
        </Button>
      )
    },
    {
      key: 'active',
      label: 'Status',
      align: 'center',
      render: (value, row) => (
        <Switch
          checked={value}
          onChange={() => handleToggleStatus(row)}
          size="small"
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: 'success.main',
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: 'success.main',
            },
          }}
        />
      )
    },
    {
      key: 'lastRun',
      label: 'Last Run',
      render: (value) => value ? dayjs(value).format('MMM D, YYYY HH:mm') : 'Never'
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => dayjs(value).format('MMM D, YYYY')
    },
    {
      key: 'status',
      label: 'Health',
      render: (value, row) => {
        const getStatusChip = (status) => {
          switch (status) {
            case 'running':
              return <Chip label="Running" size="small" color="info" />;
            case 'success':
              return <Chip label="Healthy" size="small" color="success" />;
            case 'error':
              return <Chip label="Error" size="small" color="error" />;
            case 'idle':
            default:
              return <Chip label="Idle" size="small" color="default" />;
          }
        };
        return getStatusChip(row.lastRunStatus || 'idle');
      }
    }
  ];

  const actions = [
    {
      label: 'Run Now',
      icon: <PlayArrowIcon fontSize="small" />,
      onClick: handleRun
    },
    {
      label: 'Edit',
      icon: <EditIcon fontSize="small" />,
      onClick: (workflow) => navigate(`/workflows/${workflow.id}`)
    },
    {
      label: 'Clone',
      icon: <CopyIcon fontSize="small" />,
      onClick: (workflow) => {
        // TODO: Implement clone functionality
        showNotification('Clone functionality coming soon', 'info');
      }
    },
    {
      label: 'View History',
      icon: <HistoryIcon fontSize="small" />,
      onClick: (workflow) => navigate(`/workflows/${workflow.id}?tab=history`)
    },
    {
      label: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      onClick: (workflow) => setDeleteDialog({ open: true, workflow }),
      disabled: (workflow) => workflow.active // Don't allow deleting active workflows
    }
  ];

  const handleRowClick = (workflow) => {
    navigate(`/workflows/${workflow.id}`);
  };

  return (
    <>
      <Box>
        <SectionHeader
          title="Workflows"
          subtitle="Manage your automated workflows and monitor their performance"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled // Placeholder for future "New Workflow" functionality
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                }
              }}
            >
              New Workflow
            </Button>
          }
        />

        <DataTable
          columns={columns}
          rows={workflows}
          loading={isLoading}
          onRowClick={handleRowClick}
          actions={actions}
          emptyMessage="No workflows found. Create your first workflow using the AI chat interface."
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => setDeleteDialog({ open: false, workflow: null })}
        PaperProps={{
          sx: {
            backgroundColor: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <DialogTitle>Delete Workflow</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteDialog.workflow?.name}"? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, workflow: null })}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleDelete(deleteDialog.workflow)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
    </>
  );
};

export default WorkflowsPage;