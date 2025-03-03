'use client';

import React, { useState, useEffect } from 'react';
import { 
  Button,
  TextField,
  Box,
  Typography,
  Paper,
  Stack,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  OutlinedInput,
  Checkbox,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon
} from '@mui/icons-material';
import { Team } from '@/types/Team';
import { Person } from '@/types/Person';
import { getAllPersons } from '@/repository/personRepository';

interface TeamFormProps {
  open: boolean;
  workspaceId: string;
  onSubmit: (team: Omit<Team, 'id'>) => void;
  onClose: () => void;
}

export const TeamForm: React.FC<TeamFormProps> = ({ 
  open,
  workspaceId,
  onSubmit, 
  onClose 
}) => {
  // State for form data
  const [formData, setFormData] = useState<Omit<Team, 'id'>>({
    name: '',
    people: []
  });

  // State for validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    people?: string;
  }>({});

  // State for available people
  const [availablePersons, setAvailablePersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // State for the person selector
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      initialize();
    }
  }, [open, workspaceId]);

  const initialize = async () => {
    try {
      setLoading(true);
      
      // Fetch all available persons from the repository
      const availablePersons = await getAllPersons(workspaceId);
      setAvailablePersons(availablePersons);
      
      setErrors({});
    } catch (err) {
      console.error('Error initializing form:', err);
      setApiError('Failed to load available persons');
    } finally {
      setLoading(false);
    }
  };

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear any error for this field when user makes changes
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle person selection changes
  const handlePersonChange = (event: SelectChangeEvent<string[]>) => {
    const values = event.target.value as string[];
    setSelectedPersonIds(values);
    
    // Update the people array in form data
    const selectedPeople = availablePersons.filter(person => 
      values.includes(person.id)
    );
    
    setFormData(prev => ({
      ...prev,
      people: selectedPeople
    }));
    
    // Clear people error if it exists
    if (errors.people) {
      setErrors(prev => ({ ...prev, people: undefined }));
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      try {
        onSubmit(formData);
        resetForm();
        onClose();
      } catch (error) {
        console.error('Error submitting form:', error);
        setApiError('Failed to create team. Please try again.');
      }
    }
  };

  // Get person initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      people: []
    });
    setSelectedPersonIds([]);
    setErrors({});
  };

  if (loading) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Loading form data...
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Create New Team
      </DialogTitle>
      <DialogContent>
        {apiError && (
          <Alert severity="error" sx={{ mb: 3 }}>{apiError}</Alert>
        )}
        
        <TextField
          margin="normal"
          required
          fullWidth
          id="name"
          label="Team Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          error={!!errors.name}
          helperText={errors.name}
          autoFocus
        />
        
        <FormControl fullWidth margin="normal">
          <InputLabel id="people-select-label">Team Members</InputLabel>
          <Select
            labelId="people-select-label"
            id="people-select"
            multiple
            value={selectedPersonIds}
            onChange={handlePersonChange}
            input={<OutlinedInput label="Team Members" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((personId) => {
                  const person = availablePersons.find(p => p.id === personId);
                  return (
                    <Chip 
                      key={personId} 
                      label={person?.name || personId} 
                      avatar={
                        <Avatar>{getInitials(person?.name || '')}</Avatar>
                      }
                    />
                  );
                })}
              </Box>
            )}
          >
            {availablePersons.map((person) => (
              <MenuItem key={person.id} value={person.id}>
                <Checkbox checked={selectedPersonIds.indexOf(person.id) > -1} />
                <ListItemText primary={person.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};