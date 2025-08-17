import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Stack,
  Divider,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuthStore } from '../store/auth';
import SectionHeader from '../components/common/SectionHeader';

const SettingsPage = () => {
  const { user, token, setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = { name };
      if (password.trim()) {
        updateData.password = password.trim();
      }

      const res = await axios.put(
        '/api/user/profile',
        updateData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      
      setUser(res.data);
      showNotification('Profile updated successfully', 'success');
      setPassword('');
    } catch (err) {
      console.error('Profile update error:', err);
      showNotification(
        err.response?.data?.message || 'Failed to update profile',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box>
        <SectionHeader
          title="Settings"
          subtitle="Manage your account settings and preferences"
        />

        <Stack spacing={3}>
          {/* Profile Settings */}
          <Paper 
            elevation={0}
            sx={{
              p: 3,
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Profile Information
            </Typography>
            
            <Stack spacing={3}>
              <TextField
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                fullWidth
                variant="outlined"
              />
              
              <TextField
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                fullWidth
                variant="outlined"
                placeholder="Leave empty to keep current password"
                helperText="Enter a new password only if you want to change it"
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={loading || !name.trim()}
                  startIcon={<SaveIcon />}
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
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Stack>
          </Paper>

          {/* Subscription Section */}
          <Paper 
            elevation={0}
            sx={{
              p: 3,
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Subscription & Billing
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage your subscription plan and billing information
            </Typography>
            
            <Box 
              sx={{
                p: 3,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 2
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Current Plan: Free
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You are currently on the free plan with basic automation features.
                Upgrade to unlock advanced workflows and integrations.
              </Typography>
              
              <Button
                variant="outlined"
                disabled
                sx={{ mt: 2 }}
              >
                Upgrade Plan (Coming Soon)
              </Button>
            </Box>
          </Paper>
        </Stack>
      </Box>

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

export default SettingsPage;