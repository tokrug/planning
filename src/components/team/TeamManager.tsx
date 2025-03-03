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
import { TeamList } from './TeamList';
import { TeamForm } from './TeamForm';
import { Team } from '@/types/Team';
import { 
  createTeam
} from '@/repository/teamRepository';

export const TeamManager: React.FC = () => {
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

  const handleFormSubmit = async (data: Omit<Team, 'id'>) => {
    try {
      // Create new team
      await createTeam({
        name: data.name,
        people: data.people
      });
      showNotification('Team created successfully', 'success');
      
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error creating team:', error);
      showNotification('Failed to create team', 'error');
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
          Teams Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Create and manage teams, add or remove team members, and view team compositions.
        </Typography>
      </Paper>

      {isFormOpen ? (
        <TeamForm 
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
              Create New Team
            </Button>
          </Stack>
          
          <TeamList 
            onDeleted={() => showNotification('Team deleted successfully', 'success')} 
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