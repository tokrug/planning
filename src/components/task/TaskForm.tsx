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
  ListItemText,
  Divider,
  Alert,
  OutlinedInput,
  Checkbox,
  ListSubheader,
  List,
  ListItem,
  IconButton,
  ListItemIcon,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  SubdirectoryArrowRight as SubtaskIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import { Task } from '@/types/Task';
import { getAllTasks } from '@/repository/taskRepository';

interface TaskFormProps {
  task?: Task;
  onSubmit: (task: Omit<Task, 'id'> & { id?: string }) => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ 
  task, 
  onSubmit, 
  onCancel 
}) => {
  // State for form data
  const [formData, setFormData] = useState<Omit<Task, 'id'> & { id?: string }>({
    title: '',
    description: '',
    estimate: 0,
    subtasks: [],
    blockedBy: []
  });

  // State for validation errors
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    estimate?: string;
  }>({});

  // State for available tasks to select as subtasks or blockers
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // State for task selection
  const [selectedParentTaskId, setSelectedParentTaskId] = useState<string | null>(null);
  const [selectedBlockerIds, setSelectedBlockerIds] = useState<string[]>([]);

  // Load all tasks and initialize form data
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Fetch all tasks
        const tasks = await getAllTasks();
        
        // If editing an existing task, filter out the current task and its subtasks
        // to avoid circular references
        if (task) {
          // Helper function to collect all subtask IDs recursively
          const collectSubtaskIds = (t: Task): string[] => {
            const ids = [t.id];
            t.subtasks?.forEach(subtask => {
              ids.push(...collectSubtaskIds(subtask));
            });
            return ids;
          };
          
          const excludeIds = task ? collectSubtaskIds(task) : [];
          const filteredTasks = tasks.filter(t => !excludeIds.includes(t.id));
          setAvailableTasks(filteredTasks);
          
          // Populate form with task data
          setFormData({
            id: task.id,
            title: task.title,
            description: task.description,
            estimate: task.estimate,
            subtasks: [...task.subtasks || []],
            blockedBy: [...task.blockedBy || []]
          });
          
          // Find parent task if this is a subtask
          const parentTask = tasks.find(t => 
            t.subtasks?.some(subtask => subtask.id === task.id)
          );
          setSelectedParentTaskId(parentTask?.id || null);
          setSelectedBlockerIds(task.blockedBy?.map(t => t.id) || []);
        } else {
          setAvailableTasks(tasks);
        }
        
        setApiError(null);
      } catch (error) {
        console.error('Error initializing form:', error);
        setApiError('Failed to load tasks data.');
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, [task]);

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear any error for this field when user makes changes
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle estimate input changes with validation
  const handleEstimateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setFormData(prev => ({ ...prev, estimate: value }));
      
      // Clear estimate error if it exists
      if (errors.estimate) {
        setErrors(prev => ({ ...prev, estimate: undefined }));
      }
    }
  };

  // Handle parent task selection changes
  const handleParentTaskChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as string;
    setSelectedParentTaskId(value || null);
    
    // When removing the current parent, we should also update the parent's subtasks
    if (!value || value === '') {
      // No parent selected
      setFormData(prev => ({
        ...prev,
        // Keep existing subtasks
      }));
    } else {
      // New parent selected
      const selectedParent = availableTasks.find(t => t.id === value);
      if (selectedParent) {
        // Note: We're not updating the parent's subtasks here
        // That will be handled by the repository when the task is saved
      }
    }
  };

  // Handle blocker selection changes
  const handleBlockerChange = (event: SelectChangeEvent<string[]>) => {
    const values = event.target.value as string[];
    setSelectedBlockerIds(values);
    
    // Update the blockedBy array in form data
    const selectedTasks = availableTasks.filter(t => 
      values.includes(t.id)
    );
    
    setFormData(prev => ({
      ...prev,
      blockedBy: selectedTasks
    }));
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.estimate < 0) {
      newErrors.estimate = 'Estimate must be a positive number';
    }
    
    // Check for circular reference (task being its own parent)
    if (selectedParentTaskId === formData.id) {
      newErrors.title = 'Task cannot be its own parent';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Submit the task with parent task ID
      const taskToSubmit = { 
        ...formData,
        parentTaskId: selectedParentTaskId  // Add parentTaskId to the submission
      };
      
      // Submit the task data
      onSubmit(taskToSubmit);
    }
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
        {task ? 'Edit Task' : 'Create New Task'}
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              name="title"
              label="Task Title"
              fullWidth
              value={formData.title}
              onChange={handleInputChange}
              error={!!errors.title}
              helperText={errors.title || "Enter a title for the task"}
              placeholder="e.g., Implement user authentication"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              required
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              error={!!errors.description}
              helperText={errors.description || "Provide a detailed description of the task"}
              placeholder="Describe what needs to be done..."
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              required
              name="estimate"
              label="Estimate (in man-days)"
              type="number"
              fullWidth
              value={formData.estimate}
              onChange={handleEstimateChange}
              error={!!errors.estimate}
              helperText={errors.estimate || "Estimated effort in man-days"}
              inputProps={{ min: 0, step: 0.5 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">days</InputAdornment>,
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Parent Task
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="parent-task-label">Select Parent Task</InputLabel>
              <Select
                labelId="parent-task-label"
                value={selectedParentTaskId || ''}
                onChange={handleParentTaskChange}
                input={<OutlinedInput label="Select Parent Task" />}
                renderValue={(selected) => {
                  if (!selected) return "None (Root Task)";
                  const selectedTask = availableTasks.find(t => t.id === selected);
                  return selectedTask ? (
                    <Chip 
                      label={selectedTask.title} 
                      icon={<AssignmentIcon />}
                    />
                  ) : "None (Root Task)";
                }}
              >
                <MenuItem value="">
                  <em>None (Root Task)</em>
                </MenuItem>
                {availableTasks.length === 0 ? (
                  <MenuItem disabled>No tasks available</MenuItem>
                ) : (
                  availableTasks.map((availableTask) => (
                    <MenuItem key={availableTask.id} value={availableTask.id}>
                      <ListItemText 
                        primary={availableTask.title} 
                        secondary={`Estimate: ${availableTask.estimate} days`} 
                      />
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Blocked By
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="blockers-label">Select Blockers</InputLabel>
              <Select
                labelId="blockers-label"
                multiple
                value={selectedBlockerIds}
                onChange={handleBlockerChange}
                input={<OutlinedInput label="Select Blockers" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((taskId) => {
                      const selectedTask = availableTasks.find(t => t.id === taskId);
                      return selectedTask ? (
                        <Chip 
                          key={taskId} 
                          label={selectedTask.title}
                          icon={<BlockIcon />}
                          color="error"
                          variant="outlined"
                        />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {availableTasks.length === 0 ? (
                  <MenuItem disabled>No tasks available</MenuItem>
                ) : (
                  availableTasks.map((availableTask) => (
                    <MenuItem key={availableTask.id} value={availableTask.id}>
                      <Checkbox checked={selectedBlockerIds.indexOf(availableTask.id) > -1} />
                      <ListItemText 
                        primary={availableTask.title} 
                        secondary={`Estimate: ${availableTask.estimate} days`} 
                      />
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            type="submit"
          >
            {task ? 'Update Task' : 'Create Task'}
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