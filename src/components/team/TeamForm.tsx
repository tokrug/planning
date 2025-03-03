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
  Avatar
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
  onSubmit: (team: Omit<Team, 'id'>) => void;
  onCancel: () => void;
}

export const TeamForm: React.FC<TeamFormProps> = ({ 
  onSubmit, 
  onCancel 
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
  const [availablePeople, setAvailablePeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // State for the person selector
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);

  // Load all people
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Fetch all people
        const people = await getAllPersons();
        setAvailablePeople(people);
        
        setApiError(null);
      } catch (error) {
        console.error('Error initializing form:', error);
        setApiError('Failed to load people data.');
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

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
    const selectedPeople = availablePeople.filter(person => 
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
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

  if (loading) {
    return <Typography>Loading form data...</Typography>;
  }

  if (apiError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {apiError}
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3, width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Create New Team
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              name="name"
              label="Team Name"
              fullWidth
              value={formData.name}
              onChange={handleInputChange}
              error={!!errors.name}
              helperText={errors.name || "Enter a name for the team"}
              placeholder="e.g., Frontend Team, Backend Team"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Team Members
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="team-members-label">Select Team Members</InputLabel>
              <Select
                labelId="team-members-label"
                multiple
                value={selectedPersonIds}
                onChange={handlePersonChange}
                input={<OutlinedInput label="Select Team Members" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((personId) => {
                      const person = availablePeople.find(p => p.id === personId);
                      return person ? (
                        <Chip 
                          key={personId} 
                          label={person.name} 
                          avatar={
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {getInitials(person.name)}
                            </Avatar>
                          }
                        />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {availablePeople.map((person) => (
                  <MenuItem key={person.id} value={person.id}>
                    <Checkbox checked={selectedPersonIds.indexOf(person.id) > -1} />
                    <ListItemText 
                      primary={person.name} 
                      secondary={person.skills.length > 0 ? person.skills.join(', ') : 'No skills'} 
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Selected Team Members */}
            {formData.people.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Current Team Members ({formData.people.length})
                </Typography>
                <List>
                  {formData.people.map((person) => (
                    <React.Fragment key={person.id}>
                      <ListItem>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {getInitials(person.name)}
                        </Avatar>
                        <ListItemText
                          primary={person.name}
                          secondary={
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              {person.skills.map((skill, index) => (
                                <Chip 
                                  key={index} 
                                  label={skill} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined" 
                                  sx={{ margin: '2px' }}
                                />
                              ))}
                              {person.skills.length === 0 && 'No skills'}
                            </Stack>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            aria-label="remove" 
                            color="error"
                            onClick={() => {
                              const newSelectedIds = selectedPersonIds.filter(id => id !== person.id);
                              setSelectedPersonIds(newSelectedIds);
                              const newPeople = formData.people.filter(p => p.id !== person.id);
                              setFormData(prev => ({ ...prev, people: newPeople }));
                            }}
                          >
                            <PersonRemoveIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No team members selected
              </Typography>
            )}
          </Grid>
        </Grid>
        
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            type="submit"
          >
            Create Team
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