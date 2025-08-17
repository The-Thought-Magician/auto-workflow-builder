import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stack,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Box,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { 
  VpnKey as KeyIcon, 
  Google as GoogleIcon, 
  Chat as SlackIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  FiberManualRecord as DotIcon
} from '@mui/icons-material';
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
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const { token } = useAuthStore();

  const getServiceIcon = (service) => {
    switch (service) {
      case 'openai':
        return <KeyIcon />;
      case 'gmail':
      case 'google-sheets':
        return <GoogleIcon />;
      case 'slack':
        return <SlackIcon />;
      default:
        return <KeyIcon />;
    }
  };

  const getServiceColor = (service) => {
    switch (service) {
      case 'openai':
        return '#10b981';
      case 'gmail':
      case 'google-sheets':
        return '#3b82f6';
      case 'slack':
        return '#8b5cf6';
      case 'typeform':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleApiKeySubmit = async () => {
    if (!apiKey.trim()) {
      showNotification('Please enter your API key', 'error');
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

      showNotification(response.data.message, 'success');
      setApiKey('');
      onCredentialAdded(service);
    } catch (error) {
      console.error('Failed to save credentials:', error);
      showNotification(error.response?.data?.message || 'Failed to save credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthConnect = async () => {
    setLoading(true);
    try {
      // For demo purposes, we'll simulate OAuth success
      // In a real implementation, this would open OAuth flow
      showNotification(`OAuth flow for ${service} would open here. For now, use the API key method.`, 'info');
    } catch (error) {
      console.error('OAuth connection failed:', error);
      showNotification('OAuth connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          sx={{ 
            mb: 2, 
            maxWidth: 600,
            background: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderLeft: `4px solid ${getServiceColor(service)}`,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            }
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* Header */}
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar 
                  sx={{ 
                    bgcolor: getServiceColor(service),
                    width: 48, 
                    height: 48,
                    boxShadow: `0 0 20px ${getServiceColor(service)}30`
                  }}
                >
                  {getServiceIcon(service)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Connect {requirements?.name || service}
                  </Typography>
                  <Chip 
                    label={requirements?.type === 'oauth' ? 'OAuth Required' : 'API Key Required'}
                    size="small"
                    sx={{ 
                      backgroundColor: `${getServiceColor(service)}20`,
                      color: getServiceColor(service),
                      border: `1px solid ${getServiceColor(service)}40`
                    }}
                  />
                </Box>
              </Stack>

              {/* Message */}
              <Typography variant="body2" color="text.secondary">
                {message}
              </Typography>

              {/* Description Alert */}
              {requirements?.description && (
                <Alert 
                  icon={<WarningIcon />} 
                  severity="info"
                  sx={{ 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}
                >
                  {requirements.description}
                </Alert>
              )}

              {/* Instructions */}
              {requirements?.type === 'api_key' && requirements?.instructions && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Setup Instructions:
                  </Typography>
                  <List dense>
                    {requirements.instructions.map((instruction, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Avatar 
                            sx={{ 
                              width: 20, 
                              height: 20, 
                              fontSize: '0.75rem',
                              bgcolor: 'primary.main'
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText 
                          primary={instruction}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Input Section */}
              {requirements?.type === 'api_key' ? (
                <Stack spacing={2}>
                  <TextField
                    label={`${requirements?.name || service} API Key`}
                    placeholder="Enter your API key..."
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={loading}
                    fullWidth
                    variant="outlined"
                    size="medium"
                  />
                  <Stack direction="row" justifyContent="flex-end">
                    <Button
                      onClick={handleApiKeySubmit}
                      disabled={!apiKey.trim() || loading}
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={16} /> : <CheckIcon />}
                      sx={{ 
                        bgcolor: getServiceColor(service),
                        '&:hover': {
                          bgcolor: getServiceColor(service),
                          filter: 'brightness(1.1)'
                        }
                      }}
                    >
                      {loading ? 'Saving...' : 'Save Credentials'}
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Click the button below to connect your {requirements?.name || service} account:
                  </Typography>
                  <Stack direction="row" justifyContent="center">
                    <Button
                      onClick={handleOAuthConnect}
                      disabled={loading}
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={16} /> : getServiceIcon(service)}
                      sx={{ 
                        bgcolor: getServiceColor(service),
                        '&:hover': {
                          bgcolor: getServiceColor(service),
                          filter: 'brightness(1.1)'
                        }
                      }}
                    >
                      {loading ? 'Connecting...' : `Connect ${requirements?.name || service}`}
                    </Button>
                  </Stack>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      </motion.div>

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

export default CredentialRequestCard;