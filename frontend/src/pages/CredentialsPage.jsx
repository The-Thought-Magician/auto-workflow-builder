import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Chip,
  CircularProgress,
  Backdrop
} from '@mui/material';
import { 
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import axios from 'axios';
import dayjs from 'dayjs';
import SectionHeader from '../components/common/SectionHeader';
import DataTable from '../components/common/DataTable';

const fetchCredentials = async (token) => {
  const res = await axios.get('/api/credentials', { 
    headers: { Authorization: `Bearer ${token}` } 
  });
  return res.data;
};

const serviceOptions = [
  { value: 'slack', label: 'Slack', icon: '💬' },
  { value: 'google', label: 'Google', icon: '🔍' },
  { value: 'openai', label: 'OpenAI', icon: '🤖' },
  { value: 'typeform', label: 'Typeform', icon: '📝' },
  { value: 'github', label: 'GitHub', icon: '🐱' },
  { value: 'notion', label: 'Notion', icon: '📑' },
  { value: 'airtable', label: 'Airtable', icon: '📊' },
  { value: 'gmail', label: 'Gmail', icon: '📧' },
];

const CredentialsPage = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ['credentials'],
    queryFn: () => fetchCredentials(token),
    enabled: !!token,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [service, setService] = useState('');
  const [credentialToken, setCredentialToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleAddCredential = async () => {
    if (!service || !credentialToken.trim()) {
      showNotification('Please select a service and enter credentials', 'error');
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        '/api/credentials',
        { service, data: { token: credentialToken.trim() } },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      
      showNotification(`${service} credentials added successfully`, 'success');
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      setModalOpen(false);
      setService('');
      setCredentialToken('');
    } catch (err) {
      console.error('Add credential error:', err);
      showNotification(
        err.response?.data?.message || 'Failed to add credentials', 
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTestCredential = async (credential) => {
    setTestingId(credential.id);
    try {
      const response = await axios.post(
        `/api/credentials/${credential.id}/test`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showNotification(
        response.data.message || `${credential.service} credentials are valid`,
        'success'
      );
    } catch (err) {
      console.error('Test credential error:', err);
      showNotification(
        err.response?.data?.message || `Failed to test ${credential.service} credentials`,
        'error'
      );
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteCredential = async (credential) => {
    try {
      await axios.delete(`/api/credentials/${credential.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showNotification(`${credential.service} credentials removed successfully`, 'success');
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
    } catch (err) {
      console.error('Delete credential error:', err);
      showNotification(
        err.response?.data?.message || 'Failed to delete credentials',
        'error'
      );
    }
  };

  const getServiceInfo = (serviceName) => {
    const serviceOption = serviceOptions.find(opt => opt.value === serviceName);
    return serviceOption || { value: serviceName, label: serviceName, icon: '🔧' };
  };

  const columns = [
    {
      key: 'service',
      label: 'Service',
      render: (value) => {
        const serviceInfo = getServiceInfo(value);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ fontSize: '1.25rem' }}>{serviceInfo.icon}</span>
            {serviceInfo.label}
          </Box>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => {
        if (testingId === row.id) {
          return <CircularProgress size={20} />;
        }
        return (
          <Chip
            label={value === 'valid' ? 'Valid' : value === 'invalid' ? 'Invalid' : 'Unknown'}
            color={value === 'valid' ? 'success' : value === 'invalid' ? 'error' : 'default'}
            size="small"
            icon={
              value === 'valid' ? <CheckCircleIcon /> : 
              value === 'invalid' ? <ErrorIcon /> : 
              undefined
            }
          />
        );
      }
    },
    {
      key: 'createdAt',
      label: 'Added',
      render: (value) => dayjs(value).format('MMM D, YYYY')
    },
    {
      key: 'lastTested',
      label: 'Last Tested',
      render: (value) => value ? dayjs(value).format('MMM D, YYYY') : 'Never'
    }
  ];

  const actions = [
    {
      label: 'Test Connection',
      icon: <RefreshIcon fontSize="small" />,
      onClick: handleTestCredential,
      disabled: (row) => testingId === row.id
    },
    {
      label: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      onClick: handleDeleteCredential
    }
  ];

  return (
    <>
      <Box>
        <SectionHeader
          title="Credentials"
          subtitle="Manage your service connections and API credentials"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModalOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                }
              }}
            >
              Add Credential
            </Button>
          }
        />

        <DataTable
          columns={columns}
          rows={credentials}
          loading={isLoading}
          actions={actions}
          emptyMessage="No credentials found. Add your first service credential to get started."
        />
      </Box>

      {/* Add Credential Dialog */}
      <Dialog 
        open={modalOpen} 
        onClose={() => !saving && setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <DialogTitle>Add New Credential</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Service"
              value={service}
              onChange={(e) => setService(e.target.value)}
              margin="normal"
              variant="outlined"
            >
              {serviceOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{option.icon}</span>
                    {option.label}
                  </Box>
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="API Key / Token"
              type="password"
              value={credentialToken}
              onChange={(e) => setCredentialToken(e.target.value)}
              margin="normal"
              variant="outlined"
              placeholder="Enter your API key or token"
              helperText="Your credentials are encrypted and stored securely"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setModalOpen(false)}
            disabled={saving}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddCredential}
            disabled={saving || !service || !credentialToken.trim()}
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <AddIcon />}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              },
              '&:disabled': {
                background: 'rgba(16, 185, 129, 0.3)',
              }
            }}
          >
            {saving ? 'Adding...' : 'Add Credential'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Testing Backdrop */}
      <Backdrop
        open={testingId !== null}
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
      >
        <CircularProgress color="primary" />
      </Backdrop>

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

export default CredentialsPage;