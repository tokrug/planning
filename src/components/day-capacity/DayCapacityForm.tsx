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
  InputAdornment
} from '@mui/material';
import { DayCapacity } from '@/types/DayCapacity';

interface DayCapacityFormProps {
  dayCapacity?: DayCapacity;
  onSubmit: (dayCapacity: Omit<DayCapacity, 'id'> & { id?: string }) => void;
  onCancel: () => void;
}

export const DayCapacityForm: React.FC<DayCapacityFormProps> = ({ 
  dayCapacity, 
  onSubmit, 
  onCancel 
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
    setFormData(prev => ({ ...prev, availability: availability / 100 }));
    
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

  return (
    <Paper sx={{ p: 3, width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {dayCapacity ? 'Edit Day Capacity' : 'Create New Day Capacity'}
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          {/* Only show ID field when creating a new entry (allow custom ID) */}
          {!dayCapacity && (
            <Grid item xs={12}>
              <TextField
                name="id"
                label="ID (Optional)"
                helperText={errors.id || "Leave blank for auto-generated ID, or specify a custom ID"}
                fullWidth
                value={formData.id || ''}
                onChange={handleInputChange}
                error={!!errors.id}
                placeholder="e.g., half-day, vacation"
              />
            </Grid>
          )}
          
          <Grid item xs={12}>
            <TextField
              required
              name="name"
              label="Name"
              fullWidth
              value={formData.name}
              onChange={handleInputChange}
              error={!!errors.name}
              helperText={errors.name || "Human-readable name for this day capacity type"}
              placeholder="e.g., Work day, Personal day"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography id="availability-slider" gutterBottom>
              Availability: {formData.availability * 100}%
            </Typography>
            <Slider
              aria-labelledby="availability-slider"
              value={formData.availability * 100}
              onChange={handleSliderChange}
              valueLabelDisplay="auto"
              step={5}
              marks={[
                { value: 0, label: '0%' },
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' }
              ]}
              min={0}
              max={100}
            />
            {errors.availability && (
              <Typography color="error" variant="caption">
                {errors.availability}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              name="availability"
              label="Availability (decimal)"
              type="number"
              fullWidth
              value={formData.availability}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setFormData(prev => ({ ...prev, availability: isNaN(value) ? 0 : value }));
              }}
              error={!!errors.availability}
              helperText={errors.availability || "Value between 0 and 1"}
              inputProps={{ min: 0, max: 1, step: 0.05 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">fraction</InputAdornment>
              }}
            />
          </Grid>
        </Grid>
        
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            type="submit"
          >
            {dayCapacity ? 'Update' : 'Create'}
          </Button>
          <Button 
            variant="outlined" 
            onClick={onCancel}
          >
            Cancel
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};