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

export const DayCapacityManager: React.FC = () => {
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
      await seedDefaultDayCapacities();
      showNotification('Default day capacities have been seeded successfully', 'success');
    } catch (error) {
      console.error('Error seeding default day capacities:', error);
      showNotification('Failed to seed default day capacities', 'error');
    }
  };

  const handleFormSubmit = async (data: Omit<DayCapacity, 'id'> & { id?: string }) => {
    try {
      if (selectedDayCapacity) {
        // Update existing day capacity
        await updateDayCapacity(selectedDayCapacity.id, data);
        showNotification('Day capacity updated successfully', 'success');
      } else {
        // Create new day capacity
        if (data.id && data.id.trim() !== '') {
          // Use custom ID - use createDayCapacityWithId which uses setDoc instead of updateDoc
          await createDayCapacityWithId(data.id, {
            name: data.name,
            availability: data.availability
          });
        } else {
          // Auto-generate ID
          await createDayCapacity({
            name: data.name,
            availability: data.availability
          });
        }
        showNotification('Day capacity created successfully', 'success');
      }
      
      setIsFormOpen(false);
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

      {isFormOpen ? (
        <DayCapacityForm 
          dayCapacity={selectedDayCapacity} 
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
              Create New Day Capacity
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<CloudUploadIcon />}
              onClick={handleSeedDefaults}
            >
              Seed Default Values
            </Button>
          </Stack>
          
          <DayCapacityList 
            onEdit={handleEditClick} 
            onDeleted={() => showNotification('Day capacity deleted successfully', 'success')} 
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