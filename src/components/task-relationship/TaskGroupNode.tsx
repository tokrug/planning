import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Typography, Box, Tooltip } from '@mui/material';
import { Task } from '../../types/Task';

interface TaskGroupData {
  task: Task;
  totalEstimate: number;
  subtaskIds: string[];
}

/**
 * Custom Group Node component that represents a parent task with its subtasks
 * The group itself represents the parent task, with a dedicated subtask area
 */
const TaskGroupNode: React.FC<NodeProps<TaskGroupData>> = ({ 
  data, 
  id, 
  selected,
  isConnectable 
}) => {
  const { task, totalEstimate, subtaskIds = [] } = data || {};
  
  if (!task) {
    return <div>Missing task data</div>;
  }
  
  // Generate a consistent light color based on task ID
  const generatePastelColor = (id: string) => {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate light pastel colors
    const h = hash % 360;
    return `hsla(${h}, 25%, 95%, 0.85)`;
  };
  
  const backgroundColor = generatePastelColor(task.id);
  
  // Tooltip content for the task
  const tooltipContent = (
    <Box sx={{ p: 1, maxWidth: 300 }}>
      <Typography variant="subtitle1">{task.title}</Typography>
      <Typography variant="body2">Estimate: {task.estimate} day(s)</Typography>
      <Typography variant="body2">Total: {totalEstimate} day(s)</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        {task.description && task.description.length > 150 
          ? `${task.description.substring(0, 150)}...` 
          : task.description}
      </Typography>
    </Box>
  );
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: selected ? '2px solid #1976d2' : '1px solid rgba(0, 0, 0, 0.12)',
        borderRadius: '8px',
        overflow: 'visible',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
      }}
    >
      {/* Parent Task Header Section */}
      <Tooltip title={tooltipContent} arrow placement="top">
        <div
          style={{
            padding: '12px 15px',
            borderTopLeftRadius: '7px',
            borderTopRightRadius: '7px',
            backgroundColor,
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            position: 'relative',
            minHeight: '80px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Input handle for being blocked by other tasks */}
          <Handle
            type="target"
            position={Position.Left}
            style={{ 
              background: '#f44336', 
              borderRadius: '50%',
              width: 10,
              height: 10,
              border: '2px solid #fff',
              top: '40px',
            }}
            id="blocked-target"
            isConnectable={isConnectable}
          />
          
          {/* Output handle for blocking other tasks */}
          <Handle
            type="source"
            position={Position.Right}
            style={{ 
              background: '#f44336', 
              borderRadius: '50%',
              width: 12,
              height: 12,
              border: '2px solid #fff',
              top: '40px',
            }}
            id="blocks-source"
            isConnectable={isConnectable}
          />
          
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 'bold',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              fontSize: '14px',
            }}
          >
            {task.title}
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 1,
            alignItems: 'center',
            opacity: 0.8,
            fontSize: '12px',
          }}>
            <span style={{ fontWeight: 'bold' }}>
              Est: {task.estimate}d
            </span>
            <span>
              Total: {totalEstimate}d
            </span>
          </Box>
          
          {/* Progress bar showing task's own estimate vs total */}
          <Box sx={{ 
            width: '100%', 
            height: 4, 
            bgcolor: 'rgba(0, 0, 0, 0.06)',
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
        </div>
      </Tooltip>
      
      {/* Subtasks Container */}
      {subtaskIds.length > 0 && (
        <div
          style={{
            padding: '8px',
            backgroundColor: 'rgba(249, 250, 251, 0.95)',
            borderBottomLeftRadius: '7px',
            borderBottomRightRadius: '7px',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          {/* Connection handle for subtasks */}
          <Handle
            type="source"
            position={Position.Bottom}
            style={{ 
              background: '#4caf50', 
              borderRadius: '50%',
              width: 12,
              height: 12,
              border: '2px solid #fff',
              visibility: 'hidden', // Hide this handle
            }}
            id="parent-source"
            isConnectable={false}
          />
          
          {subtaskIds.length > 0 && (
            <div
              style={{
                marginTop: '-18px',
                marginBottom: '8px',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#666',
                  backgroundColor: 'white',
                  padding: '1px 8px',
                  borderRadius: '10px',
                  border: '1px solid #eee',
                }}
              >
                SUBTASKS
              </span>
            </div>
          )}
          
          {/* Here is where the actual subtask nodes will be rendered */}
          <div
            style={{
              flexGrow: 1,
              border: subtaskIds.length > 0 ? '1px dashed rgba(0, 0, 0, 0.1)' : 'none',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              padding: '2px',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            {/* Subtask nodes are positioned here by React Flow */}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskGroupNode;