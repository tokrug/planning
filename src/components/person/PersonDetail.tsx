'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  TextField, 
  IconButton, 
  Button, 
  Divider, 
  LinearProgress, 
  Card,
  CardContent,
  CardHeader,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  Snackbar,
  Grid,
  OutlinedInput
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  CalendarMonth as CalendarIcon,
  EventBusy as ExceptionIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Person } from '@/types/Person';
import { WeeklySchedule } from '@/types/WeeklySchedule';
import { ScheduleException } from '@/types/ScheduleException';
import { DayCapacity } from '@/types/DayCapacity';
import { 
  getPersonById, 
  updatePerson
} from '@/repository/personRepository';
import { getAllDayCapacities } from '@/repository/dayCapacityRepository';

interface PersonDetailProps {
  personId: string;
}

export const PersonDetail: React.FC<PersonDetailProps> = ({ personId }) => {
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState('');
  const [dayCapacities, setDayCapacities] = useState<DayCapacity[]>([]);
  
  // Skills state and dialog
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  // Exception dialog
  const [isAddingException, setIsAddingException] = useState(false);
  const [newException, setNewException] = useState<ScheduleException>({
    date: new Date().toISOString().substring(0, 10),
    availability: { id: '', name: '', availability: 0 }
  });

  // Weekly schedule editing
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [selectedDay, setSelectedDay] = useState<keyof WeeklySchedule | null>(null);
  const [selectedDayCapacity, setSelectedDayCapacity] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    open: boolean;
  }>({
    message: '',
    type: 'success',
    open: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch person data
        const personData = await getPersonById(personId);
        
        if (personData) {
          setPerson(personData);
          setName(personData.name);
          setSkills([...personData.skills]);
        } else {
          setError('Person not found');
        }

        // Fetch day capacities for schedule editing
        const capacities = await getAllDayCapacities();
        setDayCapacities(capacities);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [personId]);

  // Handler for name editing
  const handleSaveName = async () => {
    if (!person || name.trim() === '') return;
    
    try {
      await updatePerson(person.id, { name });
      setIsEditingName(false);
      
      // Update local state
      setPerson({
        ...person,
        name
      });
      
      showNotification('Name updated successfully', 'success');
    } catch (err) {
      console.error('Error updating name:', err);
      showNotification('Failed to update name', 'error');
    }
  };

  // Handlers for skills
  const handleAddSkill = () => {
    if (newSkill.trim() === '') return;
    
    // Add the skill if it doesn't already exist
    if (!skills.includes(newSkill.trim())) {
      const updatedSkills = [...skills, newSkill.trim()];
      setSkills(updatedSkills);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSaveSkills = async () => {
    if (!person) return;
    
    try {
      await updatePerson(person.id, { skills });
      setIsEditingSkills(false);
      
      // Update local state
      setPerson({
        ...person,
        skills
      });
      
      showNotification('Skills updated successfully', 'success');
    } catch (err) {
      console.error('Error updating skills:', err);
      showNotification('Failed to update skills', 'error');
    }
  };

  // Handlers for weekly schedule
  const handleOpenScheduleEdit = (day: keyof WeeklySchedule) => {
    if (!person) return;
    
    setSelectedDay(day);
    setSelectedDayCapacity(person.weeklySchedule[day].id);
    setIsEditingSchedule(true);
  };

  const handleSaveSchedule = async () => {
    if (!person || !selectedDay) return;
    
    try {
      const selectedCapacity = dayCapacities.find(dc => dc.id === selectedDayCapacity);
      if (!selectedCapacity) return;
      
      // Create updated schedule
      const updatedSchedule = {
        ...person.weeklySchedule,
        [selectedDay]: selectedCapacity
      };
      
      await updatePerson(person.id, { weeklySchedule: updatedSchedule });
      
      // Update local state
      setPerson({
        ...person,
        weeklySchedule: updatedSchedule
      });
      
      setIsEditingSchedule(false);
      showNotification(`${capitalizeFirstLetter(selectedDay)} schedule updated successfully`, 'success');
    } catch (err) {
      console.error('Error updating schedule:', err);
      showNotification('Failed to update schedule', 'error');
    }
  };

  // Handlers for schedule exceptions
  const handleAddExceptionChange = (field: keyof ScheduleException, value: any) => {
    if (field === 'availability') {
      const dayCapacity = dayCapacities.find(dc => dc.id === value);
      if (dayCapacity) {
        setNewException({
          ...newException,
          availability: dayCapacity
        });
      }
    } else {
      setNewException({
        ...newException,
        [field]: value
      });
    }
  };

  const handleSaveException = async () => {
    if (!person || !newException.availability.id) return;
    
    try {
      // Check if there's already an exception for this date
      const existingExceptionIndex = person.scheduleExceptions.findIndex(
        ex => ex.date === newException.date
      );
      
      let updatedExceptions;
      
      if (existingExceptionIndex >= 0) {
        // Update existing exception
        updatedExceptions = [...person.scheduleExceptions];
        updatedExceptions[existingExceptionIndex] = newException;
      } else {
        // Add new exception
        updatedExceptions = [...person.scheduleExceptions, newException];
      }
      
      await updatePerson(person.id, { scheduleExceptions: updatedExceptions });
      
      // Update local state
      setPerson({
        ...person,
        scheduleExceptions: updatedExceptions
      });
      
      setIsAddingException(false);
      setNewException({
        date: new Date().toISOString().substring(0, 10),
        availability: { id: '', name: '', availability: 0 }
      });
      
      showNotification('Schedule exception added successfully', 'success');
    } catch (err) {
      console.error('Error adding exception:', err);
      showNotification('Failed to add exception', 'error');
    }
  };

  const handleDeleteException = async (exceptionDate: string) => {
    if (!person) return;
    
    try {
      const updatedExceptions = person.scheduleExceptions.filter(
        ex => ex.date !== exceptionDate
      );
      
      await updatePerson(person.id, { scheduleExceptions: updatedExceptions });
      
      // Update local state
      setPerson({
        ...person,
        scheduleExceptions: updatedExceptions
      });
      
      showNotification('Exception removed successfully', 'success');
    } catch (err) {
      console.error('Error removing exception:', err);
      showNotification('Failed to remove exception', 'error');
    }
  };

  // Helper functions
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

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Date formatting helper
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!person) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Person not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => router.push('/people')}
        sx={{ mb: 2 }}
      >
        Back to People
      </Button>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        {/* Person Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          {isEditingName ? (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <TextField
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                label="Name"
                variant="outlined"
                size="small"
                autoFocus
              />
              <IconButton onClick={handleSaveName} color="primary">
                <SaveIcon />
              </IconButton>
            </Box>
          ) : (
            <>
              <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                {person.name}
              </Typography>
              <IconButton onClick={() => setIsEditingName(true)} color="primary">
                <EditIcon />
              </IconButton>
            </>
          )}
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Skills Section */}
        <Card sx={{ mb: 4 }}>
          <CardHeader 
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Skills</Typography>
                <Button 
                  startIcon={<EditIcon />} 
                  variant="outlined" 
                  size="small"
                  onClick={() => setIsEditingSkills(true)}
                >
                  Edit Skills
                </Button>
              </Box>
            }
          />
          <CardContent>
            {person.skills.length > 0 ? (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {person.skills.map((skill, index) => (
                  <Chip 
                    key={index} 
                    label={skill} 
                    color="primary" 
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No skills defined yet. Click 'Edit Skills' to add some.
              </Typography>
            )}
          </CardContent>
        </Card>
        
        {/* Weekly Schedule */}
        <Card sx={{ mb: 4 }}>
          <CardHeader 
            title={
              <Typography variant="h6">
                <CalendarIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Weekly Schedule
              </Typography>
            }
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Day</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Availability</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(Object.keys(person.weeklySchedule) as Array<keyof WeeklySchedule>).map((day) => {
                    const daySchedule = person.weeklySchedule[day];
                    return (
                      <TableRow key={day}>
                        <TableCell>{capitalizeFirstLetter(day)}</TableCell>
                        <TableCell>{daySchedule.name}</TableCell>
                        <TableCell>{daySchedule.availability * 100}%</TableCell>
                        <TableCell>
                          <Button 
                            startIcon={<EditIcon />} 
                            size="small"
                            onClick={() => handleOpenScheduleEdit(day)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        
        {/* Schedule Exceptions */}
        <Card>
          <CardHeader 
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                  <ExceptionIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Schedule Exceptions
                </Typography>
                <Button 
                  startIcon={<AddIcon />} 
                  variant="outlined" 
                  size="small"
                  onClick={() => setIsAddingException(true)}
                >
                  Add Exception
                </Button>
              </Box>
            }
          />
          <CardContent>
            {person.scheduleExceptions.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Availability</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {person.scheduleExceptions
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((exception) => (
                        <TableRow key={exception.date}>
                          <TableCell>{formatDate(exception.date)}</TableCell>
                          <TableCell>{exception.availability.name}</TableCell>
                          <TableCell>{exception.availability.availability * 100}%</TableCell>
                          <TableCell>
                            <IconButton 
                              color="error" 
                              size="small"
                              onClick={() => handleDeleteException(exception.date)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No schedule exceptions defined yet.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Paper>
      
      {/* Skills Edit Dialog */}
      <Dialog 
        open={isEditingSkills} 
        onClose={() => setIsEditingSkills(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Skills</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <TextField
              label="New Skill"
              fullWidth
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddSkill();
                }
              }}
              size="small"
            />
            <Button 
              onClick={handleAddSkill} 
              variant="contained" 
              startIcon={<AddIcon />}
              sx={{ mt: 1 }}
            >
              Add Skill
            </Button>
          </Box>
          
          <Typography variant="subtitle2" gutterBottom>
            Current Skills
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {skills.map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                onDelete={() => handleRemoveSkill(skill)}
                color="primary"
              />
            ))}
            {skills.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No skills added yet
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditingSkills(false)}>Cancel</Button>
          <Button onClick={handleSaveSkills} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Schedule Edit Dialog */}
      <Dialog 
        open={isEditingSchedule} 
        onClose={() => setIsEditingSchedule(false)}
      >
        <DialogTitle>
          Edit {selectedDay && capitalizeFirstLetter(selectedDay)} Schedule
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="day-capacity-label">Day Status</InputLabel>
            <Select
              labelId="day-capacity-label"
              value={selectedDayCapacity}
              onChange={(e) => setSelectedDayCapacity(e.target.value)}
              label="Day Status"
            >
              {dayCapacities.map((capacity) => (
                <MenuItem key={capacity.id} value={capacity.id}>
                  {capacity.name} ({capacity.availability * 100}%)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditingSchedule(false)}>Cancel</Button>
          <Button onClick={handleSaveSchedule} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Exception Dialog */}
      <Dialog 
        open={isAddingException} 
        onClose={() => setIsAddingException(false)}
      >
        <DialogTitle>Add Schedule Exception</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                value={newException.date}
                onChange={(e) => handleAddExceptionChange('date', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="exception-status-label">Status</InputLabel>
                <Select
                  labelId="exception-status-label"
                  value={newException.availability.id}
                  onChange={(e) => handleAddExceptionChange('availability', e.target.value)}
                  label="Status"
                >
                  {dayCapacities.map((capacity) => (
                    <MenuItem key={capacity.id} value={capacity.id}>
                      {capacity.name} ({capacity.availability * 100}%)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddingException(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveException} 
            variant="contained"
            disabled={!newException.date || !newException.availability.id}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notifications */}
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
    </Container>
  );
};