import React from 'react';
import { NavLink } from 'react-router-dom';
import { Stack, Box, Text, Group, ThemeIcon } from '@mantine/core';
import {
  IconMessageCircle,
  IconGitBranch,
  IconKey,
  IconSettings,
} from '@tabler/icons-react';

const navItems = [
  { label: 'Chat', icon: IconMessageCircle, to: '/chat' },
  { label: 'Workflows', icon: IconGitBranch, to: '/workflows' },
  { label: 'Credentials', icon: IconKey, to: '/credentials' },
  { label: 'Settings', icon: IconSettings, to: '/settings' },
];

const Sidebar = () => {
  return (
    <Box
      sx={(theme) => ({
        width: 240,
        backgroundColor: theme.colors.dark[7],
        padding: theme.spacing.md,
        borderRight: `1px solid ${theme.colors.dark[5]}`,
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
      })}
    >
      <Text fz="xl" fw={700} mb="lg">
        AI Automator
      </Text>
      <Stack spacing="sm">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: 8,
              color: isActive ? '#fff' : '#b0b8c0',
              backgroundColor: isActive ? 'rgba(0, 123, 255, 0.2)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
            })}
          >
            <Group spacing="sm">
              <ThemeIcon variant="light" color="blue" size="sm">
                <Icon size={18} />
              </ThemeIcon>
              <Text>{label}</Text>
            </Group>
          </NavLink>
        ))}
      </Stack>
    </Box>
  );
};

export default Sidebar;