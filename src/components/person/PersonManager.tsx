'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Snackbar, 
  Alert, 
  Stack,
  Paper
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { PersonList } from './PersonList';
import { PersonForm } from './PersonForm';
import { Person } from '@/types/Person';
import { 
  createPerson
} from '@/repository/personRepository';

export const PersonManager: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    open: boolean;
  }>({
    message: '',
    type: 'success',
    open: false
  });

  const handleCreateClick = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleFormSubmit = async (data: Omit<Person, 'id'>) => {
    try {
      // Create new person
      await createPerson({
        name: data.name,
        skills: data.skills,
        weeklySchedule: data.weeklySchedule,
        scheduleExceptions: data.scheduleExceptions
      });
      showNotification('Person created successfully', 'success');
      
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error creating person:', error);
      showNotification('Failed to create person', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({
      message,
      type,
      open: true
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ width: '100%', py: 0 }}>
      <Paper sx={{ p: 3, mb: 2, width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Team Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage team members, their skills, and availability schedules.
        </Typography>
      </Paper>

      {isFormOpen ? (
        <PersonForm 
          onSubmit={handleFormSubmit} 
          onCancel={handleCloseForm} 
        />
      ) : (
        <Box>
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
            >
              Add New Team Member
            </Button>
          </Stack>
          
          <PersonList 
            onDeleted={() => showNotification('Person deleted successfully', 'success')} 
          />
        </Box>
      )}

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.type} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};