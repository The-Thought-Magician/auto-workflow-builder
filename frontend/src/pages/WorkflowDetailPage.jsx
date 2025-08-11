import React, { useEffect } from 'react';
import {
  Box,
  Tabs,
  Loader,
  Text,
  Textarea,
  Group,
  Button,
  Table,
} from '@mantine/core';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dayjs from 'dayjs';
import { showNotification } from '@mantine/notifications';

const WorkflowDetailPage = () => {
  const { id } = useParams();
  const { token } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'visualizer';
  const { data: workflow, isLoading, refetch } = useQuery(
    ['workflow', id],
    async () => {
      const res = await axios.get(`/api/workflows/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    { enabled: !!id },
  );
  const { data: historyData, refetch: refetchHistory } = useQuery(
    ['workflowHistory', id],
    async () => {
      const res = await axios.get(`/api/workflows/${id}/history`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    { enabled: initialTab === 'history' },
  );

  // Build nodes and edges for React Flow
  const { nodes, edges } = React.useMemo(() => {
    if (!workflow?.configuration) return { nodes: [], edges: [] };
    const nodes = (workflow.configuration.nodes || []).map((node, idx) => ({
      id: node.id || String(idx),
      data: { label: node.name || node.type },
      position: { x: node.position?.x || idx * 150, y: node.position?.y || 0 },
    }));
    const connections = workflow.configuration.connections || {};
    const edges = [];
    Object.keys(connections).forEach((from) => {
      const outputs = connections[from];
      Object.keys(outputs).forEach((outKey) => {
        outputs[outKey].forEach((connection) => {
          edges.push({
            id: `${from}-${connection.node}`,
            source: from,
            target: connection.node,
            animated: true,
          });
        });
      });
    });
    return { nodes, edges };
  }, [workflow]);

  const handleConfigurationSave = async () => {
    // parse JSON from text area and update
    try {
      const parsed = JSON.parse(configText);
      await axios.put(
        `/api/workflows/${id}`,
        { configuration: parsed },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showNotification({ title: 'Updated', message: 'Configuration saved', color: 'green' });
      refetch();
    } catch (err) {
      showNotification({ title: 'Error', message: err.message, color: 'red' });
    }
  };

  // Editable config state
  const [configText, setConfigText] = React.useState('');
  useEffect(() => {
    if (workflow?.configuration) {
      setConfigText(JSON.stringify(workflow.configuration, null, 2));
    }
  }, [workflow]);

  if (isLoading) {
    return <Loader />;
  }

  if (!workflow) {
    return <Text>Workflow not found</Text>;
  }

  return (
    <Box>
      <Text size="xl" fw={600} mb="md">
        {workflow.name}
      </Text>
      <Tabs value={initialTab} onTabChange={(value) => setSearchParams({ tab: value })}>
        <Tabs.List>
          <Tabs.Tab value="visualizer">Visualizer</Tabs.Tab>
          <Tabs.Tab value="configuration">Configuration</Tabs.Tab>
          <Tabs.Tab value="history">Run History</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="visualizer" pt="md">
          <Box sx={{ height: 400, border: '1px solid', borderColor: 'gray' }}>
            <ReactFlow nodes={nodes} edges={edges} nodesDraggable={false} nodesConnectable={false} zoomOnScroll={false}>
              <Background gap={12} size={1} color="#444" />
              <Controls showZoom={true} showFitView={true} showInteractive={false} />
            </ReactFlow>
          </Box>
        </Tabs.Panel>
        <Tabs.Panel value="configuration" pt="md">
          <Textarea
            value={configText}
            onChange={(e) => setConfigText(e.currentTarget.value)}
            minRows={12}
            autosize
          />
          <Group mt="md">
            <Button onClick={handleConfigurationSave}>Save Configuration</Button>
            <Button variant="outline" onClick={() => setConfigText(JSON.stringify(workflow.configuration, null, 2))}>
              Reset
            </Button>
          </Group>
        </Tabs.Panel>
        <Tabs.Panel value="history" pt="md">
          {historyData ? (
            <Table striped highlightOnHover>
              <thead>
                <tr>
                  <th>Execution ID</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((exec) => (
                  <tr key={exec.id || exec.executionId}>
                    <td>{exec.id || exec.executionId}</td>
                    <td>{exec.status}</td>
                    <td>{dayjs(exec.createdAt || exec.startedAt).format('YYYY-MM-DD HH:mm')}</td>
                    <td>
                      {/* Could link to execution details page if implemented */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Loader />
          )}
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
};

export default WorkflowDetailPage;