import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  CircularProgress,
  Container,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuthStore } from '../store/auth';

const schema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const SignUpPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const onSubmit = async (values) => {
    try {
      const res = await axios.post('/api/auth/register', values);
      const { token, user } = res.data;
      login(token, user);
      showNotification(`Welcome aboard, ${user.name}!`, 'success');
      navigate('/');
    } catch (err) {
      console.error('Registration failed:', err);
      showNotification(err.response?.data?.message || 'Registration failed. Please try again.', 'error');
    }
  };

  return (
    <>
      <Box 
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at top right, rgba(139, 92, 246, 0.1), transparent 70%), radial-gradient(ellipse at bottom left, rgba(59, 130, 246, 0.1), transparent 70%), #0f172a',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Decorative Elements */}
        <Box 
          sx={{
            position: 'absolute',
            top: '15%',
            left: '15%',
            width: 250,
            height: 250,
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(50px)'
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            bottom: '15%',
            right: '15%',
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)'
          }}
        />

        <Container maxWidth="xs">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.6,
              ease: [0.68, -0.55, 0.265, 1.55]
            }}
          >
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                borderRadius: 3,
                background: 'rgba(30, 41, 59, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), transparent)'
                }
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography 
                  variant="h4" 
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    mb: 1
                  }}
                >
                  Get Started
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create your account to start automating workflows
                </Typography>
              </Box>

              <Box 
                component="form" 
                onSubmit={handleSubmit(onSubmit)} 
                noValidate 
                sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
              >
                <TextField
                  label="Full Name"
                  placeholder="Your full name"
                  fullWidth
                  {...register('name')}
                  error={Boolean(errors.name?.message)}
                  helperText={errors.name?.message}
                  autoComplete="name"
                  variant="outlined"
                />
                <TextField
                  label="Email Address"
                  placeholder="you@company.com"
                  fullWidth
                  {...register('email')}
                  error={Boolean(errors.email?.message)}
                  helperText={errors.email?.message}
                  autoComplete="email"
                  variant="outlined"
                />
                <TextField
                  label="Password"
                  type="password"
                  placeholder="Create a secure password"
                  fullWidth
                  {...register('password')}
                  error={Boolean(errors.password?.message)}
                  helperText={errors.password?.message}
                  autoComplete="new-password"
                  variant="outlined"
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={isSubmitting}
                  size="large"
                  sx={{ 
                    py: 1.5,
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                      boxShadow: '0 6px 20px rgba(139, 92, 246, 0.6)',
                      transform: 'translateY(-1px)'
                    },
                    '&:disabled': {
                      background: 'rgba(139, 92, 246, 0.3)',
                      boxShadow: 'none'
                    }
                  }}
                >
                  {isSubmitting ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      Creating account...
                    </Box>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </Box>

              <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

              <Typography variant="body2" align="center" color="text.secondary">
                Already have an account?{' '}
                <Button 
                  component={Link} 
                  to="/login" 
                  variant="text"
                  sx={{ 
                    color: 'secondary.light',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Sign in
                </Button>
              </Typography>
            </Paper>
          </motion.div>
        </Container>
      </Box>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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

export default SignUpPage;