'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box,
  Typography,
  IconButton,
  Collapse,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Stack,
  Chip,
  Tooltip,
  Button
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon, 
  Delete as DeleteIcon,
  AddCircleOutline as AddSubtaskIcon,
  Cancel as CancelIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon
} from '@mui/icons-material';
import { Task } from '@/types/Task';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  workspaceId: string;
  onEdit: (task: Task) => void;
  onAddSubtask: (parentTask: Task) => void;
  onRemoveSubtask: (parentId: string, subtaskId: string) => void;
  onRemoveBlocker: (taskId: string, blockerId: string) => void;
  onDelete: (id: string) => Promise<void>;
}

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  loading,
  workspaceId,
  onEdit,
  onAddSubtask,
  onRemoveSubtask,
  onRemoveBlocker,
  onDelete
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  
  // Debug top-level tasks and their subtasks
  useEffect(() => {
    console.log("TaskList rendering with tasks:", tasks?.length || 0);
    tasks?.forEach(task => {
      const subtasks = task.subtasks || [];
      if (subtasks.length > 0) {
        console.log(`Task ${task.id} (${task.title}) has ${subtasks.length} subtasks in UI`);
      }
    });
  }, [tasks]);

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };
  
  const isExpanded = (taskId: string): boolean => {
    return !!expandedTasks[taskId];
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await onDelete(id);
      } catch (err) {
        console.error('Error deleting task:', err);
      }
    }
  };
  
  const calculateTotalEstimate = (task: Task): number => {
    if (!task.subtasks || !Array.isArray(task.subtasks) || task.subtasks.length === 0) {
      return task.estimate || 0;
    }
    
    const subtasksEstimate = task.subtasks.reduce(
      (sum, subtask) => sum + calculateTotalEstimate(subtask), 
      0
    );
    
    return (task.estimate || 0) + subtasksEstimate;
  };

  // Task component to render a single task item
  const TaskItem = ({ task, level = 0 }: { task: Task; level?: number }) => {
    // Safely ensure subtasks and blockedBy are arrays
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const blockedBy = Array.isArray(task.blockedBy) ? task.blockedBy : [];
    
    const hasSubtasks = subtasks.length > 0;
    const isTaskBlocked = blockedBy.length > 0;
    
    if (hasSubtasks && level === 0) {
      console.log(`Rendering task ${task.id} with ${subtasks.length} subtasks`);
    }
    
    return (
      <Box>
        {/* Main task item */}
        <ListItem
          sx={{
            borderLeft: level > 0 ? '1px dashed rgba(0, 0, 0, 0.12)' : 'none',
            pl: level > 0 ? level * 3 + 2 : 2,
            pr: 2,
            py: 1.5,
            bgcolor: level === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
            ...(hasSubtasks && level === 0 ? {
              borderLeft: '3px solid',
              borderLeftColor: 'primary.main',
            } : {}),
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
            borderRadius: '4px',
            mb: 0.5
          }}
        >
          {/* Expand/Collapse button for tasks with subtasks */}
          {hasSubtasks && (
            <ListItemIcon sx={{ minWidth: 36 }}>
              <IconButton
                size="small"
                onClick={() => toggleExpanded(task.id)}
                sx={{ color: 'primary.main' }}
              >
                {isExpanded(task.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </ListItemIcon>
          )}
          
          {/* Task content */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                {task.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {task.description}
              </Typography>
              
              {/* Blockers badges */}
              {isTaskBlocked && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {blockedBy.map(blocker => (
                    <Chip
                      key={blocker.id}
                      size="small"
                      label={blocker.title}
                      icon={<CancelIcon fontSize="small" />}
                      onDelete={() => onRemoveBlocker(task.id, blocker.id)}
                      sx={{ borderRadius: 1 }}
                    />
                  ))}
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <Chip 
                label={`${task.estimate || 0}d`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mr: 1, minWidth: '45px', fontWeight: 'medium' }}
              />
              {hasSubtasks && (
                <Tooltip title="Total estimate (including subtasks)">
                  <Chip
                    label={`${calculateTotalEstimate(task)}d total`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    sx={{ mr: 1, fontWeight: 'medium' }}
                  />
                </Tooltip>
              )}
            </Box>
          </Box>
          
          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <Tooltip title="Edit Task">
              <IconButton
                size="small"
                onClick={() => onEdit(task)}
                sx={{ ml: 0.5 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Add Subtask">
              <IconButton
                size="small"
                onClick={() => {
                  if (typeof onAddSubtask === 'function') {
                    onAddSubtask(task);
                  }
                }}
                sx={{ ml: 0.5 }}
              >
                <AddSubtaskIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Delete Task">
              <IconButton
                size="small"
                onClick={() => handleDelete(task.id)}
                sx={{ ml: 0.5 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </ListItem>
        
        {/* Subtasks section */}
        {hasSubtasks && isExpanded(task.id) && (
          <Box sx={{ mt: 1, ml: level > 0 ? 0 : 3, borderLeft: '1px dashed rgba(0, 0, 0, 0.12)', pl: 2 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                mb: 1, 
                color: 'text.secondary',
                ml: 1
              }}
            >
              Subtasks ({subtasks.length})
            </Typography>
            {subtasks.map(subtask => (
              <Box key={subtask.id} sx={{ mb: 1 }}>
                <TaskItem 
                  task={subtask} 
                  level={level + 1}
                />
                {/* Subtask removal button */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  pr: 2,
                  mt: -1
                }}>
                  <Button
                    size="small"
                    startIcon={<RemoveCircleOutlineIcon />}
                    onClick={() => onRemoveSubtask(task.id, subtask.id)}
                    sx={{ 
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      color: 'error.main'
                    }}
                  >
                    Remove as subtask
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Loading tasks...
        </Typography>
      </Box>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No tasks found. Click the "Add Task" button to create one.
        </Typography>
      </Box>
    );
  }

  // Get only top-level tasks (tasks that are not subtasks of any other task)
  const getTopLevelTasks = () => {
    // Find all task IDs that are subtasks
    const subtaskIds = new Set<string>();
    tasks.forEach(task => {
      if (task.subtasks) {
        task.subtasks.forEach(subtask => {
          subtaskIds.add(subtask.id);
        });
      }
    });
    
    // Filter tasks to only include those that are not subtasks
    return tasks.filter(task => !subtaskIds.has(task.id));
  };

  const topLevelTasks = getTopLevelTasks();
  
  // Debug log
  useEffect(() => {
    console.log(`Total tasks: ${tasks.length}, Top-level tasks: ${topLevelTasks.length}`);
  }, [tasks, topLevelTasks]);

  // Main task list - only show top-level tasks
  return (
    <List disablePadding sx={{ bgcolor: 'background.paper', borderRadius: '4px' }}>
      {topLevelTasks.map((task, index) => (
        <React.Fragment key={task.id}>
          {index > 0 && <Divider component="li" />}
          <TaskItem task={task} />
        </React.Fragment>
      ))}
    </List>
  );
};