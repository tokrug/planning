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
  Autocomplete,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { format } from 'date-fns';
import { Person } from '@/types/Person';
import { DayCapacity } from '@/types/DayCapacity';
import { WeeklySchedule } from '@/types/WeeklySchedule';
import { ScheduleException } from '@/types/ScheduleException';
import { getAllDayCapacities } from '@/repository/dayCapacityRepository';
import { createEmptyWeeklySchedule, createStandardWeeklySchedule } from '@/repository/personRepository';
import { Moment } from 'moment';
import moment from 'moment';

interface PersonFormProps {
  open: boolean;
  workspaceId: string;
  onSubmit: (person: Omit<Person, 'id'>) => void;
  onClose: () => void;
}

export const PersonForm: React.FC<PersonFormProps> = ({ 
  open,
  workspaceId,
  onSubmit, 
  onClose 
}) => {
  // State for form data
  const [formData, setFormData] = useState<Omit<Person, 'id'>>({
    name: '',
    skills: [],
    weeklySchedule: {
      monday: { id: '', name: '', availability: 0 },
      tuesday: { id: '', name: '', availability: 0 },
      wednesday: { id: '', name: '', availability: 0 },
      thursday: { id: '', name: '', availability: 0 },
      friday: { id: '', name: '', availability: 0 },
      saturday: { id: '', name: '', availability: 0 },
      sunday: { id: '', name: '', availability: 0 }
    },
    scheduleExceptions: []
  });

  // State for validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    skills?: string;
    weeklySchedule?: string;
  }>({});

  // State for day capacities
  const [dayCapacities, setDayCapacities] = useState<DayCapacity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // State for the new skill input
  const [newSkill, setNewSkill] = useState<string>('');

  // State for exception dialog
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState<boolean>(false);
  const [newException, setNewException] = useState<{
    date: Date | null;
    availabilityId: string;
  }>({
    date: null,
    availabilityId: ''
  });

  useEffect(() => {
    if (open) {
      initialize();
    }
  }, [open, workspaceId]);

  const initialize = async () => {
    try {
      setLoading(true);
      
      // Fetch day capacities for schedule setup
      const capacities = await getAllDayCapacities(workspaceId);
      setDayCapacities(capacities);
      
      // Find default capacities for initial setup
      const dayOff = capacities.find(c => c.id === 'day-off');
      const workDay = capacities.find(c => c.id === 'full');
      
      if (dayOff && workDay) {
        // Set up a standard weekly schedule (work days Mon-Fri, off on weekends)
        setFormData(prev => ({
          ...prev,
          weeklySchedule: {
            monday: workDay,
            tuesday: workDay,
            wednesday: workDay,
            thursday: workDay,
            friday: workDay,
            saturday: dayOff,
            sunday: dayOff
          }
        }));
      }
      
      setApiError(null);
    } catch (err) {
      console.error('Error initializing form:', err);
      setApiError('Failed to load required data');
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

  // Handle adding a skill
  const handleAddSkill = () => {
    if (newSkill.trim()) {
      // Only add if it's not already in the skills array
      if (!formData.skills.includes(newSkill.trim())) {
        setFormData(prev => ({
          ...prev,
          skills: [...prev.skills, newSkill.trim()]
        }));
      }
      setNewSkill('');
    }
  };

  // Handle removing a skill
  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  // Handle changing a day's capacity in the weekly schedule
  const handleDayCapacityChange = (day: keyof WeeklySchedule, capacityId: string) => {
    const selectedCapacity = dayCapacities.find(c => c.id === capacityId);
    
    if (selectedCapacity) {
      setFormData(prev => ({
        ...prev,
        weeklySchedule: {
          ...prev.weeklySchedule,
          [day]: selectedCapacity
        }
      }));
    }
  };

  // Handle opening the exception dialog
  const handleOpenExceptionDialog = () => {
    setNewException({
      date: new Date(),
      availabilityId: ''
    });
    setExceptionDialogOpen(true);
  };

  // Handle closing the exception dialog
  const handleCloseExceptionDialog = () => {
    setExceptionDialogOpen(false);
  };

  // Handle adding a new schedule exception
  const handleAddException = () => {
    if (newException.date && newException.availabilityId) {
      const selectedCapacity = dayCapacities.find(c => c.id === newException.availabilityId);
      
      if (selectedCapacity) {
        const dateString = format(newException.date, 'yyyy-MM-dd');
        
        // Check if an exception already exists for this date
        const existingIndex = formData.scheduleExceptions.findIndex(
          e => e.date === dateString
        );
        
        if (existingIndex >= 0) {
          // Update existing exception
          const updatedExceptions = [...formData.scheduleExceptions];
          updatedExceptions[existingIndex] = {
            date: dateString,
            availability: selectedCapacity
          };
          
          setFormData(prev => ({
            ...prev,
            scheduleExceptions: updatedExceptions
          }));
        } else {
          // Add new exception
          setFormData(prev => ({
            ...prev,
            scheduleExceptions: [
              ...prev.scheduleExceptions,
              {
                date: dateString,
                availability: selectedCapacity
              }
            ]
          }));
        }
        
        handleCloseExceptionDialog();
      }
    }
  };

  // Handle removing a schedule exception
  const handleRemoveException = (date: string) => {
    setFormData(prev => ({
      ...prev,
      scheduleExceptions: prev.scheduleExceptions.filter(e => e.date !== date)
    }));
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
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

  // Helper function to format availability as percentage
  const formatAvailability = (value: number): string => {
    return `${value * 100}%`;
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      skills: [],
      weeklySchedule: {
        monday: { id: '', name: '', availability: 0 },
        tuesday: { id: '', name: '', availability: 0 },
        wednesday: { id: '', name: '', availability: 0 },
        thursday: { id: '', name: '', availability: 0 },
        friday: { id: '', name: '', availability: 0 },
        saturday: { id: '', name: '', availability: 0 },
        sunday: { id: '', name: '', availability: 0 }
      },
      scheduleExceptions: []
    });
    setNewSkill('');
    setExceptionDialogOpen(false);
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

  if (apiError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {apiError}
      </Alert>
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
        Create New Person
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                name="name"
                label="Name"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                error={!!errors.name}
                helperText={errors.name || "Person's full name"}
                placeholder="e.g., John Doe"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Skills
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField
                  name="newSkill"
                  label="Add Skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="e.g., JavaScript, React, Node.js"
                  fullWidth
                />
                <Button 
                  variant="outlined" 
                  onClick={handleAddSkill}
                  disabled={!newSkill.trim()}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Stack>
              
              <Box sx={{ mt: 1, mb: 2 }}>
                {formData.skills.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {formData.skills.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        onDelete={() => handleRemoveSkill(skill)}
                        color="primary"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No skills added yet
                  </Typography>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Weekly Schedule
              </Typography>
              
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Day</TableCell>
                    <TableCell>Capacity Type</TableCell>
                    <TableCell>Availability</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Define ordered weekdays array */}
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <TableRow key={day}>
                      <TableCell sx={{ textTransform: 'capitalize' }}>
                        {day}
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={formData.weeklySchedule[day as keyof WeeklySchedule].id}
                            onChange={(e) => handleDayCapacityChange(day as keyof WeeklySchedule, e.target.value)}
                          >
                            {dayCapacities.map((dayCapacity) => (
                              <MenuItem key={dayCapacity.id} value={dayCapacity.id}>
                                {dayCapacity.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {formatAvailability(formData.weeklySchedule[day as keyof WeeklySchedule].availability)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  Schedule Exceptions
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<DateRangeIcon />}
                  onClick={handleOpenExceptionDialog}
                >
                  Add Exception
                </Button>
              </Stack>
              
              {formData.scheduleExceptions.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Day</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Availability</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.scheduleExceptions
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((exception, index) => {
                        // Convert date string to Date object to get day name
                        const date = new Date(exception.date);
                        const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>{exception.date}</TableCell>
                            <TableCell>{dayName}</TableCell>
                            <TableCell>{exception.availability.name}</TableCell>
                            <TableCell>{formatAvailability(exception.availability.availability)}</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveException(exception.date)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    }
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No schedule exceptions added yet
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
              Save
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
        
        {/* Add Exception Dialog */}
        <Dialog open={exceptionDialogOpen} onClose={handleCloseExceptionDialog}>
          <DialogTitle>Add Schedule Exception</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1, minWidth: 300 }}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  label="Select Date"
                  value={moment(newException.date)}
                  onChange={(newDate) => setNewException(prev => ({ ...prev, date: newDate?.toDate() ?? null }))}
                />
              </LocalizationProvider>
              
              <FormControl fullWidth>
                <InputLabel>Capacity Type</InputLabel>
                <Select
                  value={newException.availabilityId}
                  label="Capacity Type"
                  onChange={(e) => setNewException(prev => ({ ...prev, availabilityId: e.target.value }))}
                >
                  {dayCapacities.map((dayCapacity) => (
                    <MenuItem key={dayCapacity.id} value={dayCapacity.id}>
                      {dayCapacity.name} ({formatAvailability(dayCapacity.availability)})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseExceptionDialog}>Cancel</Button>
            <Button 
              onClick={handleAddException}
              disabled={!newException.date || !newException.availabilityId}
              variant="contained"
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};