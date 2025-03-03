import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Box, 
  Typography, 
  Tooltip, 
  Paper, 
  TextField, 
  IconButton, 
  InputAdornment,
  ClickAwayListener
} from '@mui/material';
import { Edit as EditIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { Task } from '../../types/Task';

interface TaskNodeData {
  task: Task;
  totalEstimate: number;
  isSubtask: boolean;
  parentId?: string;
  onTaskUpdate?: (taskId: string, updates: { title?: string; estimate?: number }) => void;
}

/**
 * Custom node component for representing a task in the relationship graph
 * Size scales based on the total estimate (including subtasks)
 */
const TaskNode: React.FC<NodeProps<TaskNodeData>> = ({ data, selected }) => {
  const { task, totalEstimate, isSubtask, onTaskUpdate } = data;
  
  // State for editable fields
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editEstimate, setEditEstimate] = useState(task.estimate.toString());
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // Calculate node width based on estimate, keep height constant
  const baseHeight = 100;
  const baseWidth = 150;
  const maxWidthScale = 3;
  const widthScale = 1 + Math.min(totalEstimate / 10, 1) * maxWidthScale;
  const width = baseWidth * widthScale;
  const height = baseHeight;
  
  // Handle editing mode
  const startEditing = () => {
    setIsEditing(true);
    setEditTitle(task.title);
    setEditEstimate(task.estimate.toString());
  };
  
  // Focus title input when editing starts
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditing]);
  
  // Save changes
  const saveChanges = () => {
    if (!onTaskUpdate) return;
    
    const newEstimate = parseFloat(editEstimate);
    if (isNaN(newEstimate) || newEstimate < 0) {
      // Invalid estimate, reset to original
      setEditEstimate(task.estimate.toString());
      return;
    }
    
    onTaskUpdate(task.id, {
      title: editTitle.trim() || task.title, // Use original if empty
      estimate: newEstimate
    });
    
    setIsEditing(false);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditTitle(task.title);
    setEditEstimate(task.estimate.toString());
  };
  
  // Handle Enter key for saving
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveChanges();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };
  
  // Format description for tooltip (truncate if needed)
  const tooltipDescription = task.description.length > 150 
    ? `${task.description.substring(0, 150)}...` 
    : task.description;
  
  const tooltipContent = (
    <Box sx={{ p: 1, maxWidth: 300 }}>
      <Typography variant="subtitle1">{task.title}</Typography>
      <Typography variant="body2">Estimate: {task.estimate} day(s)</Typography>
      <Typography variant="body2">Total: {totalEstimate} day(s)</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>{tooltipDescription}</Typography>
    </Box>
  );

  return (
    <Box>
      {!isEditing ? (
        <Tooltip title={tooltipContent} arrow placement="top" disableHoverListener={isEditing}>
          <Paper
            elevation={selected ? 8 : 3}
            sx={{
              width,
              height,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 2,
              border: selected ? '2px solid #1976d2' : 'none',
              borderRadius: 2,
              background: isSubtask ? 'rgba(250, 250, 250, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              transition: 'all 0.2s ease',
              position: 'relative',
              '&:hover': {
                boxShadow: 6,
              },
            }}
          >
            {/* Input handle (for being blocked by other tasks) */}
            <Handle
              type="target"
              position={Position.Left}
              style={{ 
                background: '#f44336', 
                borderRadius: '50%',
                width: 10,
                height: 10,
                border: '2px solid #fff',
              }}
              id="blocked-target"
            />
            
            {/* Input handle (for being a subtask of another task) */}
            <Handle
              type="target"
              position={Position.Top}
              style={{ 
                background: '#4caf50', 
                borderRadius: '50%',
                width: 10,
                height: 10,
                border: '2px solid #fff', 
              }}
              id="subtask-target"
            />

            {/* Output handle (for blocking other tasks) */}
            <Handle
              type="source"
              position={Position.Right}
              style={{ 
                background: '#f44336', 
                borderRadius: '50%',
                width: 12,
                height: 12,
                border: '2px solid #fff',
              }}
              id="blocks-source"
            />
            
            {/* Output handle (for having subtasks) */}
            <Handle
              type="source"
              position={Position.Bottom}
              style={{ 
                background: '#4caf50', 
                borderRadius: '50%',
                width: 12,
                height: 12,
                border: '2px solid #fff',
              }}
              id="parent-source"
            />
            
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 'bold',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                width: '100%'
              }}
            >
              {task.title}
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              width: '100%', 
              mt: 1,
              px: 1,
              alignItems: 'center'
            }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                Est: {task.estimate}d
              </Typography>
              
              {onTaskUpdate && (
                <IconButton 
                  size="small" 
                  onClick={startEditing}
                  sx={{ padding: 0.5 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              
              <Typography variant="caption">
                Total: {totalEstimate}d
              </Typography>
            </Box>
            
            {/* Progress bar visual to show task's own estimate vs total with subtasks */}
            <Box sx={{ 
              width: '90%', 
              height: 4, 
              bgcolor: '#e0e0e0',
              mt: 1,
              borderRadius: 1,
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                width: `${(task.estimate / totalEstimate) * 100}%`, 
                height: '100%', 
                bgcolor: '#1976d2'
              }} />
            </Box>
          </Paper>
        </Tooltip>
      ) : (
        <ClickAwayListener onClickAway={cancelEditing}>
          <Paper
            elevation={8}
            sx={{
              width: Math.max(width, 300), // Minimum width for edit form
              minHeight: Math.max(height + 80, 200), // Minimum height for edit form
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 3,
              border: '2px solid #1976d2',
              borderRadius: 2,
              background: '#ffffff',
              position: 'absolute',
              top: -10,
              left: -10,
              zIndex: 100,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >
            {/* Handles remain visible while editing */}
            <Handle
              type="target"
              position={Position.Left}
              style={{ background: '#f44336', borderRadius: 0 }}
            />
            <Handle
              type="target"
              position={Position.Top}
              style={{ background: '#4caf50', borderRadius: 0 }}
              id="subtask-target"
            />
            <Handle
              type="source"
              position={Position.Right}
              style={{ background: '#f44336', borderRadius: 0 }}
              id="blocks-source"
            />
            <Handle
              type="source"
              position={Position.Bottom}
              style={{ background: '#4caf50', borderRadius: 0 }}
              id="parent-source"
            />
            
            {/* Form title */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Edit Task
            </Typography>
            
            {/* Title field */}
            <TextField
              fullWidth
              variant="outlined"
              label="Task Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              inputRef={titleInputRef}
              autoFocus
              sx={{ mb: 3 }}
            />
            
            {/* Estimate field */}
            <TextField
              fullWidth
              variant="outlined"
              label="Estimate (days)"
              value={editEstimate}
              onChange={(e) => setEditEstimate(e.target.value)}
              onKeyDown={handleKeyDown}
              type="number"
              inputProps={{ min: 0, step: 0.25 }}
              sx={{ mb: 3 }}
            />
            
            {/* Task info */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Task ID: {task.id}
              </Typography>
              {isSubtask && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Subtask of parent task
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" display="block">
                Total estimate (with subtasks): {totalEstimate} days
              </Typography>
            </Box>
            
            {/* Action buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto', pt: 2 }}>
              <IconButton 
                onClick={cancelEditing} 
                sx={{ mr: 1 }}
                color="error"
                size="medium"
              >
                <CloseIcon />
              </IconButton>
              <IconButton 
                onClick={saveChanges}
                color="primary"
                size="medium"
              >
                <CheckIcon />
              </IconButton>
            </Box>
          </Paper>
        </ClickAwayListener>
      )}
    </Box>
  );
};

export default TaskNode;