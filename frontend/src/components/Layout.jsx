import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, Flex, Avatar, Menu, Text, Group, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconLogout } from '@tabler/icons-react';
import Sidebar from './Sidebar';
import { useAuthStore } from '../store/auth';

const Layout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Flex>
      <Sidebar />
      <Box sx={{ flex: 1, minHeight: '100vh', overflow: 'auto' }}>
        {/* Header */}
        <Flex
          justify="space-between"
          align="center"
          sx={(theme) => ({
            padding: theme.spacing.md,
            borderBottom: `1px solid ${theme.colors.dark[5]}`,
            backgroundColor: theme.colors.dark[7],
          })}
        >
          <Text fw={600}>AI Workflow Automation</Text>
          {user && (
            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <UnstyledButton>
                  <Group spacing="xs">
                    <Avatar color="blue" radius="xl">
                      {user.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Text>{user.name}</Text>
                    <IconChevronDown size={16} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item icon={<IconLogout size={16} />} onClick={handleLogout}>
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Flex>
        {/* Content */}
        <Box p="md">
          <Outlet />
        </Box>
      </Box>
    </Flex>
  );
};

export default Layout;