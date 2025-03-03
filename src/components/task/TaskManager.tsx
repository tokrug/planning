'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Snackbar, 
  Alert, 
  Stack,
  Paper,
  ToggleButtonGroup,
  ToggleButton
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
import { 
  createTask, 
  updateTask,
  getAllTasks,
  removeBlocker,
  addSubtask,
  removeSubtask
} from '@/repository/taskRepository';

export const TaskManager: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    open: boolean;
  }>({
    message: '',
    type: 'success',
    open: false
  });
  
  // Fetch all tasks when component mounts
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const fetchedTasks = await getAllTasks();
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        showNotification('Failed to load tasks', 'error');
      }
    };
    
    fetchTasks();
  }, []);

  const handleCreateClick = () => {
    setSelectedTask(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (task: Task) => {
    setSelectedTask(task);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleFormSubmit = async (data: Omit<Task, 'id'> & { id?: string, parentTaskId?: string | null }) => {
    try {
      // Get the parent task ID from the form data
      const parentTaskId = data.parentTaskId;
      
      if (selectedTask) {
        // Update existing task
        await updateTask(selectedTask.id, {
          title: data.title,
          description: data.description,
          estimate: data.estimate,
          subtasks: data.subtasks || [],
          blockedBy: data.blockedBy || []
        });
        
        // Find current parent task (if any)
        const allTasks = await getAllTasks();
        const currentParentTask = allTasks.find(task => 
          task.subtasks?.some(subtask => subtask.id === selectedTask.id)
        );
        
        // Handle parent task change
        if (parentTaskId && parentTaskId !== currentParentTask?.id) {
          // Remove from current parent if exists
          if (currentParentTask) {
            await removeSubtask(currentParentTask.id, selectedTask.id);
          }
          
          // Add to new parent
          await addSubtask(parentTaskId, selectedTask.id);
        } else if (!parentTaskId && currentParentTask) {
          // Remove from current parent if no parent is selected
          await removeSubtask(currentParentTask.id, selectedTask.id);
        }
        
        showNotification('Task updated successfully', 'success');
      } else {
        // Create new task
        const newTask = await createTask({
          title: data.title,
          description: data.description,
          estimate: data.estimate,
          subtasks: data.subtasks || [],
          blockedBy: data.blockedBy || []
        });
        
        // If parent task is selected, add as subtask
        if (parentTaskId) {
          await addSubtask(parentTaskId, newTask.id);
        }
        
        showNotification('Task created successfully', 'success');
      }
      
      // Refresh tasks list after changes
      const updatedTasks = await getAllTasks();
      setTasks(updatedTasks);
      
      setIsFormOpen(false);
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

      {isFormOpen ? (
        <TaskForm 
          task={selectedTask} 
          onSubmit={handleFormSubmit} 
          onCancel={handleCloseForm} 
        />
      ) : (
        <Box>
          <Stack direction="row" spacing={2} sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
            >
              Create New Task
            </Button>
            
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              aria-label="view mode"
            >
              <ToggleButton value="list" aria-label="list view">
                <ListIcon />
              </ToggleButton>
              <ToggleButton value="graph" aria-label="graph view">
                <TreeIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          
          {viewMode === 'list' ? (
            <TaskList 
              onEdit={handleEditClick} 
              onDeleted={async () => {
                showNotification('Task deleted successfully', 'success');
                // Refresh tasks after delete
                const updatedTasks = await getAllTasks();
                setTasks(updatedTasks);
              }} 
            />
          ) : (
            <TaskRelationshipGraph
              tasks={tasks}
              onTaskSelect={setSelectedTask}
              onTaskUpdate={async (taskId, updates) => {
                try {
                  // Find the task to update
                  const taskToUpdate = tasks.find(t => t.id === taskId);
                  if (!taskToUpdate) return;
                  
                  // Apply updates
                  const updatedTask = {
                    ...taskToUpdate,
                    ...updates
                  };
                  
                  // Update in database
                  await updateTask(taskId, updatedTask);
                  
                  // Refresh tasks list
                  const updatedTasks = await getAllTasks();
                  setTasks(updatedTasks);
                  
                  // Show notification
                  showNotification('Task updated successfully', 'success');
                } catch (error) {
                  console.error('Error updating task:', error);
                  showNotification('Failed to update task', 'error');
                }
              }}
              onTaskCreate={async (newTask) => {
                try {
                  // Create the new task
                  await createTask(newTask);
                  
                  // Refresh tasks list
                  const updatedTasks = await getAllTasks();
                  setTasks(updatedTasks);
                  
                  showNotification('Task created successfully', 'success');
                } catch (error) {
                  console.error('Error creating task:', error);
                  showNotification('Failed to create task', 'error');
                }
              }}
            />
          )}
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