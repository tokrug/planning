'use client';

import React, { useState, useEffect } from 'react';
import { 
  Button,
  TextField,
  Slider,
  Box,
  Typography,
  Paper,
  Stack,
  Grid,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { DayCapacity } from '@/types/DayCapacity';

interface DayCapacityFormProps {
  open: boolean;
  dayCapacity?: DayCapacity;
  onSubmit: (dayCapacity: Omit<DayCapacity, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

export const DayCapacityForm: React.FC<DayCapacityFormProps> = ({ 
  open,
  dayCapacity, 
  onSubmit, 
  onClose 
}) => {
  const [formData, setFormData] = useState<Omit<DayCapacity, 'id'> & { id?: string }>({
    name: '',
    availability: 0
  });

  const [errors, setErrors] = useState<{
    name?: string;
    availability?: string;
    id?: string;
  }>({});

  // Initialize form when editing an existing day capacity
  useEffect(() => {
    if (dayCapacity) {
      setFormData({
        id: dayCapacity.id,
        name: dayCapacity.name,
        availability: dayCapacity.availability
      });
    }
  }, [dayCapacity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear any error for this field when user makes changes
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    const availability = newValue as number;
    setFormData(prev => ({ ...prev, availability: availability }));
    
    // Clear availability error when user makes changes
    if (errors.availability) {
      setErrors(prev => ({ ...prev, availability: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.availability < 0 || formData.availability > 1) {
      newErrors.availability = 'Availability must be between 0 and 1';
    }
    
    // If creating a new entry with custom ID
    if (formData.id !== undefined && !dayCapacity) {
      if (!formData.id.trim()) {
        newErrors.id = 'ID is required';
      } else if (!/^[a-z0-9-_\/]+$/i.test(formData.id)) {
        newErrors.id = 'ID can only contain letters, numbers, hyphens, underscores, and forward slashes';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      availability: 0
    });
    setErrors({});
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {dayCapacity ? 'Edit Day Capacity' : 'Create Day Capacity'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
          {/* Form fields */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            autoFocus
          />
          
          <Box sx={{ mt: 4, mb: 2 }}>
            <Typography gutterBottom>
              Availability (hours)
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <Slider
                  value={formData.availability}
                  onChange={handleSliderChange}
                  min={0}
                  max={1}
                  step={0.05}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 0.25, label: '25%' },
                    { value: 0.5, label: '50%' },
                    { value: 0.75, label: '75%' },
                    { value: 1, label: '100%' }
                  ]}
                />
              </Grid>
              <Grid item>
                <TextField
                  value={formData.availability}
                  name="availability"
                  onChange={handleInputChange}
                  inputProps={{
                    step: 0.05,
                    min: 0,
                    max: 1,
                    type: 'number',
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  sx={{ width: '100px' }}
                />
              </Grid>
            </Grid>
          </Box>
          
          {!dayCapacity && (
            <TextField
              margin="normal"
              fullWidth
              id="id"
              label="Custom ID (optional)"
              name="id"
              value={formData.id || ''}
              onChange={handleInputChange}
              helperText="Leave blank for auto-generated ID"
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};