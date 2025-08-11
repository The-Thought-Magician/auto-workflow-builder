import React from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  Tooltip,
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTheme } from '@mui/material/styles';
import { useAuthStore } from '../store/auth';

const navItems = [
  { label: 'Chat', to: '/chat', icon: <ChatBubbleOutlineIcon fontSize="small" /> },
  { label: 'Workflows', to: '/workflows', icon: <AccountTreeIcon fontSize="small" /> },
  { label: 'Credentials', to: '/credentials', icon: <VpnKeyIcon fontSize="small" /> },
  { label: 'Settings', to: '/settings', icon: <SettingsIcon fontSize="small" /> }
];

const drawerWidth = 240;

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [menuAnchor, setMenuAnchor] = React.useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar disableGutters sx={{ px: 2 }}>
        <Typography variant="h6" fontWeight={600} sx={{ background: 'linear-gradient(90deg,#8b5cf6,#5b74f9)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          AI Automator
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1 }}>
        {navItems.map(item => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            sx={() => ({
              '&.active, &[aria-current=page]': {
                background: 'linear-gradient(90deg, rgba(139,92,246,0.18), rgba(91,116,249,0.18))'
              }
            })}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'primary.light' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2, typography: 'caption', opacity: 0.6 }}>v1.0.0</Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" elevation={0} sx={{ backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Toolbar sx={{ gap: 1 }}>
          {!isDesktop && (
            <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)} aria-label="open navigation">
              <MenuIcon />
            </IconButton>
          )}
          {isDesktop && <Box sx={{ width: drawerWidth }} />}
          <Typography variant="h6" sx={{ flex: 1 }} noWrap>AI Workflow Automation</Typography>
          {user && (
            <>
              <Tooltip title={user.name}>
                <Avatar
                  sx={{ cursor: 'pointer', bgcolor: 'primary.main' }}
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" style={{ marginRight: 8 }} /> Logout
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>
      {/* Drawer */}
      {isDesktop ? (
        <Drawer
          variant="permanent"
          open
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', backgroundColor: 'rgba(18,24,38,0.85)' }
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: drawerWidth, backdropFilter: 'blur(10px)', backgroundColor: 'rgba(18,24,38,0.9)' } }}
        >
          {drawerContent}
        </Drawer>
      )}
      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, minHeight: '100vh', pl: { md: 0 }, pt: 8 }}>
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
