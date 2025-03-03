'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Snackbar, 
  Alert, 
  Divider,
  Stack,
  Paper
} from '@mui/material';
import { Add as AddIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { DayCapacityList } from './DayCapacityList';
import { DayCapacityForm } from './DayCapacityForm';
import { DayCapacity } from '@/types/DayCapacity';
import { 
  createDayCapacity, 
  createDayCapacityWithId,
  updateDayCapacity, 
  seedDefaultDayCapacities 
} from '@/repository/dayCapacityRepository';

interface DayCapacityManagerProps {
  workspaceId: string;
}

export const DayCapacityManager: React.FC<DayCapacityManagerProps> = ({ workspaceId }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDayCapacity, setSelectedDayCapacity] = useState<DayCapacity | undefined>(undefined);
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
    setSelectedDayCapacity(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (dayCapacity: DayCapacity) => {
    setSelectedDayCapacity(dayCapacity);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSeedDefaults = async () => {
    try {
      await seedDefaultDayCapacities(workspaceId);
      showNotification('Default day capacities seeded successfully', 'success');
    } catch (error) {
      console.error('Error seeding default day capacities:', error);
      showNotification('Failed to seed default day capacities', 'error');
    }
  };

  const handleFormSubmit = async (data: Omit<DayCapacity, 'id'> & { id?: string }) => {
    try {
      if (selectedDayCapacity) {
        // Updating existing day capacity
        await updateDayCapacity(workspaceId, selectedDayCapacity.id, {
          name: data.name,
          availability: data.availability
        });
        showNotification('Day capacity updated successfully', 'success');
      } else if (data.id) {
        // Creating day capacity with custom ID
        await createDayCapacityWithId(workspaceId, data.id, {
          name: data.name,
          availability: data.availability
        });
        showNotification('Day capacity created successfully', 'success');
      } else {
        // Creating day capacity with auto-generated ID
        await createDayCapacity(workspaceId, {
          name: data.name,
          availability: data.availability
        });
        showNotification('Day capacity created successfully', 'success');
      }
      
      setIsFormOpen(false);
      setSelectedDayCapacity(undefined);
    } catch (error) {
      console.error('Error saving day capacity:', error);
      showNotification('Failed to save day capacity', 'error');
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
          Day Capacity Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage day capacity configurations that define the availability of personnel for different types of days.
        </Typography>
      </Paper>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">Day Capacities</Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<CloudUploadIcon />} 
            onClick={handleSeedDefaults}
            sx={{ mr: 2 }}
          >
            Seed Defaults
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleCreateClick}
          >
            Add Capacity
          </Button>
        </Box>
      </Stack>

      <Paper sx={{ mb: 3 }}>
        <DayCapacityList 
          workspaceId={workspaceId}
          onEdit={handleEditClick} 
          onListChanged={() => showNotification('List updated', 'success')} 
        />
      </Paper>

      <DayCapacityForm 
        open={isFormOpen} 
        dayCapacity={selectedDayCapacity} 
        onClose={handleCloseForm} 
        onSubmit={handleFormSubmit} 
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