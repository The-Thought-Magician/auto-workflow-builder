import { createTheme } from '@mui/material/styles';

// Core design tokens (can later be externalized to CSS vars file)
const palette = {
  mode: 'dark',
  primary: { main: '#5b74f9', light: '#8da2ff', dark: '#3046c6' },
  secondary: { main: '#8b5cf6' },
  background: { default: '#121826', paper: '#1e2433' },
  success: { main: '#3cc68a' },
  error: { main: '#ef4444' },
  warning: { main: '#f59e0b' },
  info: { main: '#3b82f6' },
  divider: 'rgba(255,255,255,0.08)'
};

const typography = {
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", Arial, sans-serif',
  h5: { fontWeight: 600 },
  body2: { color: 'rgba(255,255,255,0.72)' }
};

const components = {
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        backdropFilter: 'blur(6px)',
        backgroundColor: 'rgba(30,36,51,0.9)'
      }
    }
  },
  MuiButton: {
    defaultProps: { size: 'medium' },
    styleOverrides: {
      root: { borderRadius: 8, textTransform: 'none', fontWeight: 500 }
    }
  },
  MuiCard: {
    styleOverrides: { root: { borderRadius: 14 } }
  },
  MuiTableHead: {
    styleOverrides: { root: { '& th': { fontWeight: 600 } } }
  },
  MuiAppBar: {
    styleOverrides: { root: { backgroundImage: 'none', backgroundColor: 'rgba(18,24,38,0.85)', backdropFilter: 'blur(8px)' } }
  }
};

export const theme = createTheme({ palette, typography, components, shape: { borderRadius: 10 } });

export default theme;
