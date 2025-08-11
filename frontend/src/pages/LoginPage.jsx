import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, TextField, Button, Paper, Typography, CircularProgress } from '@mui/material';
// TODO: Replace showNotification with Snackbar system
import { showNotification } from '@mantine/notifications';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/auth';

const schema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      const res = await axios.post('/api/auth/login', values);
      const { token, user } = res.data;
      login(token, user);
      showNotification({ title: 'Welcome back!', message: `Hello, ${user.name}`, color: 'green' });
      navigate('/');
    } catch (err) {
      showNotification({ title: 'Login failed', message: err.response?.data?.message || err.message, color: 'red' });
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 25% 25%, rgba(91,116,249,0.25), transparent 60%), #121826'
    }}>
      <Paper elevation={6} sx={{ width: 380, p: 4, borderRadius: 3, backdropFilter: 'blur(8px)' }}>
        <Typography variant="h5" fontWeight={600} align="center" gutterBottom>
          Sign in
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email"
            placeholder="you@company.com"
            size="small"
            fullWidth
            {...register('email')}
            error={Boolean(errors.email?.message)}
            helperText={errors.email?.message}
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            placeholder="Your password"
            size="small"
            fullWidth
            {...register('password')}
            error={Boolean(errors.password?.message)}
            helperText={errors.password?.message}
            autoComplete="current-password"
          />
          <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ mt: 1 }}>
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Sign in'}
          </Button>
        </Box>
        <Typography variant="body2" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
          Don't have an account?{' '}
          <Button component={Link} to="/signup" size="small" variant="text">Sign up</Button>
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage;