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

interface PersonManagerProps {
  workspaceId: string;
}

export const PersonManager: React.FC<PersonManagerProps> = ({ workspaceId }) => {
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
      await createPerson(workspaceId, data);
      setIsFormOpen(false);
      showNotification('Person created successfully', 'success');
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
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">People</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleCreateClick}
        >
          Add Person
        </Button>
      </Stack>

      <Paper sx={{ mb: 3 }}>
        <PersonList workspaceId={workspaceId} onListChanged={() => showNotification('List updated', 'success')} />
      </Paper>

      <PersonForm 
        open={isFormOpen} 
        onClose={handleCloseForm} 
        onSubmit={handleFormSubmit}
        workspaceId={workspaceId}
      />

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