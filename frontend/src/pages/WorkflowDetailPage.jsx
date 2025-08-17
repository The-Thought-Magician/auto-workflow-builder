import React, { useState, useMemo } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  TextField,
  Button,
  Stack,
  Typography,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Code as CodeIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import SectionHeader from '../components/common/SectionHeader';
import DataTable from '../components/common/DataTable';

const WorkflowDetailPage = () => {
  const { id } = useParams();
  const { token } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'visualizer';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [configValue, setConfigValue] = useState('');
  const [configSaving, setConfigSaving] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const { data: workflow, isLoading, refetch } = useQuery({
    queryKey: ['workflow', id],
    queryFn: async () => {
      const res = await axios.get(`/api/workflows/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      return res.data;
    },
    enabled: !!id,
  });

  const { data: historyData = [], isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['workflowHistory', id],
    queryFn: async () => {
      const res = await axios.get(`/api/workflows/${id}/history`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      return res.data;
    },
    enabled: !!id && activeTab === 'history',
  });

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Build nodes and edges for React Flow
  const { nodes, edges } = useMemo(() => {
    if (!workflow?.configuration) return { nodes: [], edges: [] };
    
    const config = typeof workflow.configuration === 'string' 
      ? JSON.parse(workflow.configuration) 
      : workflow.configuration;

    const nodes = (config.nodes || []).map((node, idx) => ({
      id: node.id || String(idx),
      data: { 
        label: node.name || node.type || `Node ${idx + 1}`,
      },
      position: { 
        x: node.position?.x || idx * 200, 
        y: node.position?.y || Math.floor(idx / 3) * 100 
      },
      style: {
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: 8,
        color: '#f8fafc',
      }
    }));

    const edges = (config.edges || []).map((edge, idx) => ({
      id: edge.id || String(idx),
      source: edge.source,
      target: edge.target,
      style: { stroke: '#3b82f6' },
      animated: true,
    }));

    return { nodes, edges };
  }, [workflow?.configuration]);

  // Initialize config value when workflow loads
  React.useEffect(() => {
    if (workflow?.configuration && !configValue) {
      const configString = typeof workflow.configuration === 'string' 
        ? workflow.configuration 
        : JSON.stringify(workflow.configuration, null, 2);
      setConfigValue(configString);
    }
  }, [workflow?.configuration, configValue]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchParams({ tab: newValue });
  };

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      let parsedConfig;
      try {
        parsedConfig = JSON.parse(configValue);
      } catch (parseErr) {
        throw new Error('Invalid JSON configuration');
      }

      await axios.put(`/api/workflows/${id}/configuration`, 
        { configuration: parsedConfig },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showNotification('Configuration saved successfully', 'success');
      refetch();
    } catch (err) {
      console.error('Save configuration error:', err);
      showNotification(
        err.message || err.response?.data?.message || 'Failed to save configuration',
        'error'
      );
    } finally {
      setConfigSaving(false);
    }
  };

  const handleResetConfig = () => {
    if (workflow?.configuration) {
      const configString = typeof workflow.configuration === 'string' 
        ? workflow.configuration 
        : JSON.stringify(workflow.configuration, null, 2);
      setConfigValue(configString);
      showNotification('Configuration reset to saved version', 'info');
    }
  };

  // History table columns
  const historyColumns = [
    {
      key: 'executionId',
      label: 'Execution ID',
      render: (value) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {value?.substring(0, 8)}...
        </Typography>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Typography 
          variant="body2" 
          sx={{ 
            color: value === 'success' ? 'success.main' : 
                   value === 'error' ? 'error.main' : 
                   value === 'running' ? 'info.main' : 'text.secondary',
            fontWeight: 500,
            textTransform: 'capitalize'
          }}
        >
          {value}
        </Typography>
      )
    },
    {
      key: 'startedAt',
      label: 'Started',
      render: (value) => dayjs(value).format('MMM D, YYYY HH:mm:ss')
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (value, row) => {
        if (!row.completedAt) return 'Running...';
        const duration = dayjs(row.completedAt).diff(dayjs(row.startedAt), 'second');
        return `${duration}s`;
      }
    }
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!workflow) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Workflow not found
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box>
        <SectionHeader
          title={workflow.name}
          subtitle={workflow.description || 'Workflow automation details and configuration'}
        />

        <Paper
          elevation={0}
          sx={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          {/* Tabs Header */}
          <Box sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="enclosed"
              sx={{
                px: 2,
                '& .MuiTabs-indicator': {
                  backgroundColor: 'primary.main',
                }
              }}
            >
              <Tab 
                label="Visualizer" 
                value="visualizer"
                icon={<VisibilityIcon />}
                iconPosition="start"
                sx={{ textTransform: 'none' }}
              />
              <Tab 
                label="Configuration" 
                value="configuration"
                icon={<CodeIcon />}
                iconPosition="start"
                sx={{ textTransform: 'none' }}
              />
              <Tab 
                label="Run History" 
                value="history"
                icon={<HistoryIcon />}
                iconPosition="start"
                sx={{ textTransform: 'none' }}
              />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <Box sx={{ p: 3 }}>
            {/* Visualizer Tab */}
            {activeTab === 'visualizer' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box 
                  sx={{ 
                    height: '600px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)'
                  }}
                >
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    fitView
                    attributionPosition="bottom-left"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <Background color="#334155" gap={16} />
                    <Controls 
                      style={{ 
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    />
                  </ReactFlow>
                </Box>
                {nodes.length === 0 && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ textAlign: 'center', mt: 2 }}
                  >
                    No workflow nodes found in configuration
                  </Typography>
                )}
              </motion.div>
            )}

            {/* Configuration Tab */}
            {activeTab === 'configuration' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Stack spacing={3}>
                  <TextField
                    multiline
                    rows={20}
                    value={configValue}
                    onChange={(e) => setConfigValue(e.target.value)}
                    variant="outlined"
                    fullWidth
                    placeholder="Enter workflow configuration (JSON format)"
                    InputProps={{
                      sx: {
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        '& .MuiOutlinedInput-input': {
                          color: 'text.primary'
                        }
                      }
                    }}
                  />
                  
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={handleResetConfig}
                      startIcon={<RefreshIcon />}
                      disabled={configSaving}
                    >
                      Reset
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSaveConfig}
                      disabled={configSaving || !configValue.trim()}
                      startIcon={configSaving ? <CircularProgress size={16} /> : <SaveIcon />}
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
                      {configSaving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                  </Stack>
                </Stack>
              </motion.div>
            )}

            {/* Run History Tab */}
            {activeTab === 'history' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DataTable
                  columns={historyColumns}
                  rows={historyData}
                  loading={historyLoading}
                  emptyMessage="No execution history found for this workflow"
                  maxHeight="600px"
                  stickyHeader
                />
              </motion.div>
            )}
          </Box>
        </Paper>
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

export default WorkflowDetailPage;