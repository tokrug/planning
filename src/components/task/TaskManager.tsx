'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Snackbar, 
  Alert, 
  Stack,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon,
  List as ListIcon,
  AccountTree as TreeIcon
} from '@mui/icons-material';
import { TaskList } from './TaskList';
import { TaskForm } from './TaskForm';
import { TaskRelationshipGraph } from '../task-relationship';
import { Task } from '@/types/Task';
import { useEntityCollection } from '@/lib/firebase/entityHooks';

interface TaskManagerProps {
  workspaceId: string;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ workspaceId }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [parentTaskId, setParentTaskId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    open: boolean;
  }>({
    message: '',
    type: 'success',
    open: false
  });

  // Use our real-time hook for tasks
  const { 
    entities: tasks, 
    loading, 
    error,
    createEntity: createTask,
    updateEntity: updateTaskData,
    deleteEntity: deleteTaskData
  } = useEntityCollection<Task>(
    workspaceId, 
    'tasks',
    [], // no conditions
    [{ field: 'title', direction: 'asc' }] // sort by title
  );

  const handleCreateClick = () => {
    setSelectedTask(undefined);
    setParentTaskId(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (task: Task) => {
    setSelectedTask(task);
    setParentTaskId(undefined);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedTask(undefined);
    setParentTaskId(undefined);
  };

  const handleFormSubmit = async (data: Omit<Task, 'id'> & { id?: string, parentTaskId?: string | null }) => {
    try {
      if (selectedTask) {
        // Update existing task
        await updateTaskData(selectedTask.id, {
          title: data.title,
          description: data.description,
          estimate: data.estimate
        });
        
        showNotification('Task updated successfully', 'success');
      } else {
        // Create new task
        const newTaskData = {
          title: data.title,
          description: data.description,
          estimate: data.estimate,
          subtasks: [],
          blockedBy: []
        };

        // If parentTaskId is provided or set in state, this is a subtask
        const taskParentId = data.parentTaskId || parentTaskId;
        
        if (taskParentId) {
          console.log(`Creating subtask for parent: ${taskParentId}`);
          
          // Get the parent task
          const parentTask = tasks.find(t => t.id === taskParentId);
          
          if (parentTask) {
            try {
              // Create the new task first
              const newTask = await createTask(newTaskData);
              
              // Create safe subtasks array, ensuring it's an array
              const currentSubtasks = Array.isArray(parentTask.subtasks) ? [...parentTask.subtasks] : [];
              
              // Add new task to parent's subtasks
              await updateTaskData(parentTask.id, { 
                subtasks: [...currentSubtasks, newTask]
              });
              
              showNotification('Subtask added successfully', 'success');
            } catch (error) {
              console.error('Error adding subtask:', error);
              showNotification('Failed to add subtask relationship', 'error');
            }
          } else {
            showNotification('Parent task not found', 'error');
          }
        } else {
          // Create a regular task (not a subtask)
          await createTask(newTaskData);
          showNotification('Task created successfully', 'success');
        }
      }

      // Reset form state
      setIsFormOpen(false);
      setSelectedTask(undefined);
      setParentTaskId(undefined);
    } catch (error) {
      console.error('Error saving task:', error);
      showNotification('Failed to save task', 'error');
    }
  };
  
  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newMode: 'list' | 'graph' | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleAddSubtask = (parentTask: Task) => {
    console.log(`Setting up to add subtask to parent: ${parentTask.id}`);
    
    if (!parentTask || !parentTask.id) {
      console.error('Invalid parent task for adding subtask');
      showNotification('Cannot add subtask to invalid parent', 'error');
      return;
    }
    
    setSelectedTask(undefined);
    setParentTaskId(parentTask.id);
    setIsFormOpen(true);
  };

  const handleRemoveSubtask = async (parentId: string, subtaskId: string) => {
    try {
      const parentTask = tasks.find(t => t.id === parentId);
      
      if (parentTask && Array.isArray(parentTask.subtasks)) {
        const updatedSubtasks = parentTask.subtasks.filter(subtask => subtask.id !== subtaskId);
        await updateTaskData(parentId, { subtasks: updatedSubtasks });
        showNotification('Subtask relationship removed', 'success');
      } else {
        console.error('Parent task or subtasks invalid', parentTask);
        showNotification('Failed to remove subtask relationship', 'error');
      }
    } catch (error) {
      console.error('Error removing subtask:', error);
      showNotification('Failed to remove subtask relationship', 'error');
    }
  };

  const handleRemoveBlocker = async (taskId: string, blockerId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.blockedBy) {
        const updatedBlockers = task.blockedBy.filter(blocker => blocker.id !== blockerId);
        await updateTaskData(taskId, { blockedBy: updatedBlockers });
        showNotification('Blocker relationship removed', 'success');
      }
    } catch (error) {
      console.error('Error removing blocker:', error);
      showNotification('Failed to remove blocker relationship', 'error');
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

  if (error) {
    return (
      <Alert severity="error">
        Error loading tasks: {error.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 0 }}>
      <Paper sx={{ p: 3, mb: 2, width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Task Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage tasks and their relationships. Tasks can have subtasks and can be blocked by other tasks.
        </Typography>
      </Paper>
      
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="h1">Tasks</Typography>
          <Stack direction="row" spacing={2}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              aria-label="view mode"
              size="small"
              sx={{
                backgroundColor: 'background.paper',
                '& .MuiToggleButton-root': {
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                }
              }}
            >
              <ToggleButton value="list" aria-label="list view">
                <Tooltip title="List View">
                  <ListIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="graph" aria-label="graph view">
                <Tooltip title="Relationship Graph">
                  <TreeIcon />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
            
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={handleCreateClick}
            >
              Add Task
            </Button>
          </Stack>
        </Stack>
      </Box>

      {viewMode === 'list' ? (
        <Paper sx={{ mb: 3 }}>
          <TaskList 
            tasks={tasks} 
            loading={loading}
            onEdit={handleEditClick}
            onAddSubtask={handleAddSubtask}
            onRemoveSubtask={handleRemoveSubtask}
            onRemoveBlocker={handleRemoveBlocker}
            workspaceId={workspaceId}
            onDelete={deleteTaskData}
          />
        </Paper>
      ) : (
        <Paper sx={{ mb: 3, p: 2 }}>
          <TaskRelationshipGraph 
            tasks={tasks}
            onTaskSelect={handleEditClick}
          />
        </Paper>
      )}

      <TaskForm 
        task={selectedTask}
        onSubmit={handleFormSubmit}
        onCancel={handleCloseForm}
        workspaceId={workspaceId}
        open={isFormOpen}
        parentTaskId={parentTaskId}
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