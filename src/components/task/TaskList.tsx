'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box,
  Typography,
  IconButton,
  Collapse,
  Paper,
  TextField,
  Button,
  Tooltip,
  LinearProgress,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Card,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AddCircleOutline as AddSubtaskIcon
} from '@mui/icons-material';
import { Task } from '@/types/Task';
import { 
  getAllTasks, 
  deleteTask, 
  createTask,
  addSubtask as addSubtaskToParent 
} from '@/repository/taskRepository';

interface TaskListProps {
  onEdit: (task: Task) => void;
  onDeleted: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({ onEdit, onDeleted }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [rootTasks, setRootTasks] = useState<Task[]>([]);
  
  // State for inline task creation
  const [showInlineForm, setShowInlineForm] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskEstimate, setNewTaskEstimate] = useState<number>(1);
  const [creatingTask, setCreatingTask] = useState<boolean>(false);
  
  // State for adding subtasks
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<Task | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<string>('');
  const [newSubtaskEstimate, setNewSubtaskEstimate] = useState<number>(1);
  const [creatingSubtask, setCreatingSubtask] = useState<boolean>(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getAllTasks();
      setTasks(data);
      
      // Identify root tasks (those not appearing as subtasks of other tasks)
      const isSubtask = new Set<string>();
      data.forEach(task => {
        task.subtasks?.forEach(subtask => {
          isSubtask.add(subtask.id);
        });
      });
      
      const rootTasksData = data.filter(task => !isSubtask.has(task.id));
      setRootTasks(rootTasksData);
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeList = async () => {
      await fetchTasks();
      
      // Automatically show the quick add form if there are no tasks
      if (tasks.length === 0) {
        setShowInlineForm(true);
      }
    };
    
    initializeList();
    
    return () => {
      // Clean up the form state when the component unmounts
      setShowInlineForm(false);
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
        await fetchTasks();
        onDeleted();
      } catch (err) {
        setError('Failed to delete task');
        console.error('Error deleting task:', err);
      }
    }
  };
  
  // Handle task creation
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || creatingTask) {
      return;
    }
    
    // Ensure estimate is valid
    const estimate = newTaskEstimate <= 0 ? 1 : newTaskEstimate;
    
    try {
      setCreatingTask(true);
      
      // Store current scroll position
      const scrollPosition = window.scrollY;
      
      // Create the task
      await createTask({
        title: newTaskTitle,
        description: `Created via quick add. Estimate: ${estimate} man-days.`,
        estimate: estimate,
        subtasks: [],
        blockedBy: []
      });
      
      // Reset form inputs but keep the form open
      setNewTaskTitle('');
      setNewTaskEstimate(1);
      
      // Refresh tasks
      await fetchTasks();
      
      // Focus back on the title field
      setTimeout(() => {
        const titleField = document.getElementById('new-task-title');
        if (titleField) {
          titleField.focus();
        }
        
        // Restore scroll position
        window.scrollTo(0, scrollPosition);
      }, 0);
    } catch (err) {
      setError('Failed to create task');
      console.error('Error creating task:', err);
    } finally {
      setCreatingTask(false);
    }
  };

  // Handle subtask creation
  const handleCreateSubtask = async () => {
    if (!addingSubtaskTo || !newSubtaskTitle.trim() || creatingSubtask) {
      return;
    }
    
    // Ensure estimate is valid
    const estimate = newSubtaskEstimate <= 0 ? 1 : newSubtaskEstimate;
    
    try {
      setCreatingSubtask(true);
      
      // Create the subtask
      const subtask = await createTask({
        title: newSubtaskTitle,
        description: `Subtask of "${addingSubtaskTo.title}". Estimate: ${estimate} man-days.`,
        estimate: estimate,
        subtasks: [],
        blockedBy: []
      });
      
      // Add as subtask to parent
      await addSubtaskToParent(addingSubtaskTo.id, subtask.id);
      
      // Reset form
      setNewSubtaskTitle('');
      setNewSubtaskEstimate(1);
      
      // Refresh tasks
      await fetchTasks();
      
      // Expand the parent to show the new subtask
      setExpandedIds(prev => ({
        ...prev,
        [addingSubtaskTo.id]: true
      }));
      
      // Close the dialog
      setAddingSubtaskTo(null);
    } catch (err) {
      setError('Failed to create subtask');
      console.error('Error creating subtask:', err);
    } finally {
      setCreatingSubtask(false);
    }
  };
  
  // Toggle expand/collapse
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const isExpanded = (id: string): boolean => {
    return !!expandedIds[id];
  };

  // Calculate total estimate (task + all subtasks)
  const calculateTotalEstimate = (task: Task): number => {
    let total = task.estimate;
    if (task.subtasks && task.subtasks.length > 0) {
      total += task.subtasks.reduce((sum, subtask) => sum + calculateTotalEstimate(subtask), 0);
    }
    return total;
  };

  // Keyboard shortcut for quick add
  useEffect(() => {
    // Add keyboard shortcut (Alt+N) to open the quick add form
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'n') {
        setShowInlineForm(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Recursive component to render task tree nodes
  const TaskTreeItem = ({ task, level = 0 }: { task: Task; level?: number }) => {
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isTaskExpanded = isExpanded(task.id);
    
    return (
      <>
        <ListItem 
          sx={{ 
            pl: 2 + level * 2,
            borderLeft: level > 0 ? '1px dashed rgba(0, 0, 0, 0.12)' : 'none',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            py: 1
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            {hasSubtasks ? (
              <IconButton 
                edge="start" 
                size="small" 
                onClick={() => toggleExpand(task.id)}
                aria-label={isTaskExpanded ? "collapse" : "expand"}
              >
                {isTaskExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            ) : (
              <Box sx={{ width: 28 }} />
            )}
          </ListItemIcon>
          
          <ListItemText
            primary={
              <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                {task.title}
              </Typography>
            }
            secondary={
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Typography variant="body2" component="span" sx={{ mr: 2 }}>
                  Estimate: {task.estimate} days
                </Typography>
                {hasSubtasks && (
                  <Typography variant="body2" component="span" color="text.secondary">
                    Total: {calculateTotalEstimate(task)} days
                  </Typography>
                )}
              </Box>
            }
          />
          
          <ListItemSecondaryAction>
            <Box sx={{ display: 'flex' }}>
              <Tooltip title="Add Subtask">
                <IconButton 
                  edge="end" 
                  size="small" 
                  onClick={() => setAddingSubtaskTo(task)}
                  sx={{ mr: 1 }}
                >
                  <AddSubtaskIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton 
                  edge="end" 
                  size="small" 
                  onClick={() => onEdit(task)}
                  color="primary"
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton 
                  edge="end" 
                  size="small" 
                  onClick={() => handleDelete(task.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </ListItemSecondaryAction>
        </ListItem>
        
        {hasSubtasks && (
          <Collapse in={isTaskExpanded} timeout="auto" unmountOnExit>
            <List disablePadding>
              {task.subtasks.map(subtask => (
                <TaskTreeItem key={subtask.id} task={subtask} level={level + 1} />
              ))}
            </List>
          </Collapse>
        )}
      </>
    );
  };

  // Quick add task form
  const renderInlineTaskForm = () => {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Quick Add Task
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            id="new-task-title"
            fullWidth
            size="small"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Enter task title"
            autoFocus
            disabled={creatingTask}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !creatingTask) {
                handleCreateTask();
              }
            }}
            label="Task Title"
          />
          <TextField
            type="number"
            size="small"
            value={newTaskEstimate}
            onChange={(e) => setNewTaskEstimate(parseFloat(e.target.value))}
            disabled={creatingTask}
            InputProps={{
              startAdornment: <InputAdornment position="start">days</InputAdornment>,
              inputProps: { min: 0.5, step: 0.5 }
            }}
            sx={{ width: '150px' }}
            label="Estimate"
          />
          <Button 
            color="primary" 
            onClick={handleCreateTask}
            disabled={!newTaskTitle.trim() || creatingTask}
            variant="contained"
            size="small"
            startIcon={creatingTask ? null : <AddIcon />}
          >
            {creatingTask ? 'Adding...' : 'Add'}
          </Button>
          <IconButton 
            color="default" 
            onClick={() => setShowInlineForm(false)}
            size="small"
            disabled={creatingTask}
          >
            <CancelIcon />
          </IconButton>
        </Box>
      </Paper>
    );
  };

  // Add subtask dialog
  const renderAddSubtaskDialog = () => {
    return (
      <Dialog 
        open={!!addingSubtaskTo} 
        onClose={() => !creatingSubtask && setAddingSubtaskTo(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Add Subtask to "{addingSubtaskTo?.title}"
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Subtask Title"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              disabled={creatingSubtask}
              autoFocus
              placeholder="Enter subtask title"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !creatingSubtask && newSubtaskTitle.trim()) {
                  handleCreateSubtask();
                }
              }}
            />
            <TextField
              type="number"
              label="Estimate (days)"
              value={newSubtaskEstimate}
              onChange={(e) => setNewSubtaskEstimate(parseFloat(e.target.value))}
              disabled={creatingSubtask}
              InputProps={{
                inputProps: { min: 0.5, step: 0.5 }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => !creatingSubtask && setAddingSubtaskTo(null)} 
            disabled={creatingSubtask}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleCreateSubtask}
            disabled={!newSubtaskTitle.trim() || creatingSubtask}
          >
            {creatingSubtask ? 'Adding...' : 'Add Subtask'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (error) {
    return (
      <Typography color="error" variant="body1">
        {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Quick add button */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          startIcon={<AddIcon />}
          onClick={() => setShowInlineForm(true)}
          size="small"
          variant="outlined"
          sx={{ display: showInlineForm ? 'none' : 'flex' }}
        >
          Quick Add Task (Alt+N)
        </Button>
      </Box>
      
      {/* Quick add form */}
      {showInlineForm && renderInlineTaskForm()}
      
      {/* Task tree */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <List disablePadding>
          {rootTasks.length > 0 ? (
            rootTasks.map(task => (
              <TaskTreeItem key={task.id} task={task} />
            ))
          ) : (
            <ListItem>
              <ListItemText 
                primary={
                  <Typography align="center">
                    No tasks found. Add a task to get started.
                  </Typography>
                } 
              />
            </ListItem>
          )}
        </List>
      </Paper>
      
      {/* Add subtask dialog */}
      {renderAddSubtaskDialog()}
    </Box>
  );
};