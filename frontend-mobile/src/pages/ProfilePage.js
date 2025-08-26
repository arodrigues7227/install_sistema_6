import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth';
import api from '../config/api';

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [updateStatus, setUpdateStatus] = useState({ type: null, message: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  const validationSchema = Yup.object({
    name: Yup.string().required(t('login.errors.required')),
    email: Yup.string()
      .email(t('login.errors.invalidEmail'))
      .required(t('login.errors.required')),
  });

  const formik = useFormik({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsUpdating(true);
      setUpdateStatus({ type: null, message: '' });

      try {
        await api.put('/users/profile', values);
        setUpdateStatus({
          type: 'success',
          message: t('profile.updateSuccess'),
        });
      } catch (error) {
        setUpdateStatus({
          type: 'error',
          message: t('profile.updateError'),
        });
      } finally {
        setIsUpdating(false);
      }
    },
    enableReinitialize: true,
  });

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
        {/* Profile Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              bgcolor: 'primary.main',
              fontSize: '2rem',
            }}
          >
            {user?.name?.[0]?.toUpperCase() || <PersonIcon />}
          </Avatar>
          <Typography variant="h5" gutterBottom>
            {t('profile.title')}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Status Alert */}
        {updateStatus.type && (
          <Alert
            severity={updateStatus.type}
            sx={{ mb: 3 }}
            onClose={() => setUpdateStatus({ type: null, message: '' })}
          >
            {updateStatus.message}
          </Alert>
        )}

        {/* Profile Form */}
        <Box component="form" onSubmit={formik.handleSubmit} noValidate>
          <TextField
            fullWidth
            id="name"
            name="name"
            label={t('profile.name')}
            variant="outlined"
            margin="normal"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
            disabled={isUpdating}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            id="email"
            name="email"
            label={t('profile.email')}
            type="email"
            variant="outlined"
            margin="normal"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            disabled={isUpdating}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isUpdating || !formik.dirty || !formik.isValid}
            sx={{ mb: 2 }}
          >
            {isUpdating ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                {t('common.loading')}
              </>
            ) : (
              t('profile.updateProfile')
            )}
          </Button>
        </Box>
      </Paper>

      {/* Additional Profile Information */}
      <Paper elevation={2} sx={{ p: 3, mt: 2, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('common.info')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" color="textSecondary">
            <strong>ID:</strong> {user?.id}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Profile:</strong> {user?.profile}
          </Typography>
          {user?.queues?.length > 0 && (
            <Typography variant="body2" color="textSecondary">
              <strong>Filas:</strong> {user.queues.map(q => q.name).join(', ')}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfilePage;