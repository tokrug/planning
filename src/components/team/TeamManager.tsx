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
import AddIcon from '@mui/icons-material/Add';
import { TeamList } from './TeamList';
import { TeamForm } from './TeamForm';
import { Team } from '../../types/Team';
import { createTeam } from '../../repository/teamRepository';

interface TeamManagerProps {
  workspaceId: string;
}

export const TeamManager: React.FC<TeamManagerProps> = ({ workspaceId }) => {
  const [formOpen, setFormOpen] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleOpenForm = () => {
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
  };

  const handleFormSubmit = async (team: Omit<Team, 'id'>) => {
    try {
      await createTeam(workspaceId, team);
      setNotification({
        open: true, 
        message: 'Team created successfully!', 
        severity: 'success'
      });
      handleCloseForm();
    } catch (error) {
      console.error('Error creating team:', error);
      setNotification({
        open: true, 
        message: 'Failed to create team', 
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenForm}
          >
            Add Team
          </Button>
        </Box>
        
        <TeamList 
          workspaceId={workspaceId} 
          onDeleted={() => setNotification({
            open: true,
            message: 'Team deleted successfully',
            severity: 'success'
          })} 
        />
      </Paper>
      
      <TeamForm
        open={formOpen}
        workspaceId={workspaceId}
        onSubmit={handleFormSubmit}
        onClose={handleCloseForm}
      />
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};