import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Fab,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import { Task } from '../../types/Task';
// Mermaid 11.x+ doesn't include a separate CSS file

interface TaskRelationshipGraphProps {
  tasks: Task[];
  onTaskSelect?: (task: Task) => void;
  onTaskUpdate?: (taskId: string, updates: { title?: string; estimate?: number }) => void;
  onTaskCreate?: (task: Omit<Task, 'id'>) => void;
  onAddBlockingRelationship?: (sourceTaskId: string, targetTaskId: string) => void;
  onRemoveBlockingRelationship?: (blockerTaskId: string, blockedTaskId: string) => void;
}

// Interface for new task form data
interface NewTaskFormData {
  title: string;
  estimate: number;
}

/**
 * Generate a Mermaid Gantt chart definition from tasks
 */
const generateMermaidGantt = (tasks: Task[]): string => {
  if (!tasks || tasks.length === 0) {
    return 'gantt\n  title Task Dependencies\n  dateFormat X\n  section No Tasks\n  No tasks found :0, 1';
  }

  // Start with the Gantt header
  let mermaidCode = 'gantt\n';
  mermaidCode += '  title Task Dependencies\n';
  mermaidCode += '  dateFormat X\n'; // Use X as date format for simple numeric positioning
  mermaidCode += '  axisFormat %d\n\n'; // Show simple day numbers on axis

  // Create a map of task ID to section name for grouping
  const taskSections = new Map<string, string>();
  
  // First, identify all root tasks and their subtasks for sections
  tasks.forEach(task => {
    // If this is a top-level task with subtasks, it gets its own section
    if (task.subtasks && task.subtasks.length > 0) {
      taskSections.set(task.id, task.title);
      
      // All subtasks belong to this section
      task.subtasks.forEach(subtask => {
        taskSections.set(subtask.id, task.title);
      });
    }
  });
  
  // Find standalone tasks (not subtasks of any task)
  const standaloneTaskIds = tasks
    .filter(task => !tasks.some(t => t.subtasks?.some(st => st.id === task.id)))
    .map(task => task.id);
  
  // Group tasks into sections
  const sections = new Map<string, Task[]>();
  
  // Default section for standalone tasks
  sections.set('Tasks', []);
  
  tasks.forEach(task => {
    const sectionName = taskSections.get(task.id) || 'Tasks';
    
    if (!sections.has(sectionName)) {
      sections.set(sectionName, []);
    }
    
    sections.get(sectionName)?.push(task);
  });
  
  // Function to generate task ID safe for Mermaid
  const safeId = (id: string) => `task_${id.replace(/-/g, '_')}`;

  // Keep track of current position for placing tasks
  let currentPos = 0;
  
  // Map of task ID to its start position in the chart
  const taskPositions = new Map<string, number>();
  
  // Process each section
  sections.forEach((sectionTasks, sectionName) => {
    // Create section header
    mermaidCode += `  section ${sectionName}\n`;
    
    // First process tasks that aren't blocked by anything
    const unblocked = sectionTasks.filter(task => !task.blockedBy || task.blockedBy.length === 0);
    const blocked = sectionTasks.filter(task => task.blockedBy && task.blockedBy.length > 0);
    
    // Place unblocked tasks first
    unblocked.forEach(task => {
      // If it's a subtask, indent it
      const isSubtask = tasks.some(t => t.subtasks?.some(st => st.id === task.id));
      const prefix = isSubtask ? '    ' : '  ';
      
      const taskId = safeId(task.id);
      const duration = task.estimate;
      
      // Store this task's position
      taskPositions.set(task.id, currentPos);
      
      // Add task to chart
      mermaidCode += `${prefix}${task.title} :${taskId}, ${currentPos}, ${duration}d\n`;
      
      // Increment position
      currentPos += duration;
    });
    
    // Now process blocked tasks, ensuring blockers are placed first
    // This may require multiple passes to handle chains of dependencies
    let remainingBlocked = [...blocked];
    
    while (remainingBlocked.length > 0) {
      let tasksProcessedThisRound = 0;
      
      for (let i = 0; i < remainingBlocked.length; i++) {
        const task = remainingBlocked[i];
        
        // Check if all blockers have been positioned
        const allBlockersPositioned = task.blockedBy?.every(
          blocker => taskPositions.has(blocker.id)
        ) ?? true;
        
        if (allBlockersPositioned) {
          // Calculate position after the last blocker
          let startAfter = 0;
          
          task.blockedBy?.forEach(blocker => {
            const blockerPos = taskPositions.get(blocker.id) || 0;
            const blockerTask = tasks.find(t => t.id === blocker.id);
            const blockerDuration = blockerTask?.estimate || 0;
            
            startAfter = Math.max(startAfter, blockerPos + blockerDuration);
          });
          
          // Ensure we don't go backward in time
          currentPos = Math.max(currentPos, startAfter);
          
          // Store this task's position
          taskPositions.set(task.id, currentPos);
          
          // Is this a subtask?
          const isSubtask = tasks.some(t => t.subtasks?.some(st => st.id === task.id));
          const prefix = isSubtask ? '    ' : '  ';
          
          const taskId = safeId(task.id);
          const duration = task.estimate;
          
          // Add dependencies
          const afterClause = task.blockedBy && task.blockedBy.length > 0
            ? ` after ${task.blockedBy.map(b => safeId(b.id)).join(' ')}`
            : '';
          
          // Add task to chart
          mermaidCode += `${prefix}${task.title} :${taskId}, ${currentPos}, ${duration}d${afterClause}\n`;
          
          // Increment position
          currentPos += duration;
          
          // Remove this task from remaining
          remainingBlocked.splice(i, 1);
          i--; // Adjust index
          
          tasksProcessedThisRound++;
        }
      }
      
      // If we couldn't process any tasks this round, we have a circular dependency
      if (tasksProcessedThisRound === 0 && remainingBlocked.length > 0) {
        // Just place the remaining tasks sequentially
        remainingBlocked.forEach(task => {
          const isSubtask = tasks.some(t => t.subtasks?.some(st => st.id === task.id));
          const prefix = isSubtask ? '    ' : '  ';
          
          const taskId = safeId(task.id);
          const duration = task.estimate;
          
          // Store this task's position
          taskPositions.set(task.id, currentPos);
          
          // Add task to chart with a warning about circular dependency
          mermaidCode += `${prefix}${task.title} (circular dependency) :${taskId}, ${currentPos}, ${duration}d\n`;
          
          // Increment position
          currentPos += duration;
        });
        
        // Clear remaining
        remainingBlocked = [];
      }
    }
    
    // Add an empty line between sections
    mermaidCode += '\n';
  });
  
  return mermaidCode;
};

/**
 * Component for visualizing task relationships using Mermaid.js Gantt charts
 */
const TaskRelationshipGraph: React.FC<TaskRelationshipGraphProps> = ({
  tasks,
  onTaskSelect,
  onTaskUpdate,
  onTaskCreate,
  onAddBlockingRelationship,
  onRemoveBlockingRelationship,
}) => {
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [mermaidReady, setMermaidReady] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState<NewTaskFormData>({
    title: '',
    estimate: 1,
  });
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    open: boolean;
  }>({
    message: '',
    type: 'info',
    open: false
  });
  
  // Initialize Mermaid.js
  useEffect(() => {
    // Load Mermaid.js dynamically
    const loadMermaid = async () => {
      try {
        // Only load mermaid if it doesn't exist yet
        if (!(window as any).mermaid) {
          const mermaid = await import('mermaid');
          mermaid.default.initialize({
            startOnLoad: true,
            theme: 'default',
            gantt: {
              titleTopMargin: 25,
              barHeight: 20,
              barGap: 4,
              topPadding: 50,
              sidePadding: 75,
            },
          });
          (window as any).mermaid = mermaid.default;
        }
        
        setMermaidReady(true);
      } catch (error) {
        console.error('Failed to load Mermaid:', error);
        showNotification('Failed to load visualization library', 'error');
      }
    };
    
    loadMermaid();
  }, []);
  
  // Generate Mermaid code whenever tasks change
  useEffect(() => {
    const ganttCode = generateMermaidGantt(tasks);
    setMermaidCode(ganttCode);
    
    // Render the diagram when code changes
    if (mermaidReady && (window as any).mermaid) {
      try {
        // Clear previous diagram
        const container = document.getElementById('mermaid-container');
        if (container) {
          container.innerHTML = '';
          
          // Create a div for the new diagram
          const diagramDiv = document.createElement('div');
          diagramDiv.className = 'mermaid';
          diagramDiv.textContent = ganttCode;
          container.appendChild(diagramDiv);
          
          // Render new diagram
          (window as any).mermaid.init(undefined, document.querySelectorAll('.mermaid'));
        }
      } catch (error) {
        console.error('Failed to render Mermaid diagram:', error);
        showNotification('Failed to render task visualization', 'error');
      }
    }
  }, [tasks, mermaidReady]);
  
  // Update zoom level
  useEffect(() => {
    const container = document.getElementById('mermaid-container');
    if (container) {
      container.style.transform = `scale(${zoomLevel / 100})`;
      container.style.transformOrigin = 'top left';
    }
  }, [zoomLevel]);
  
  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({
      message,
      type,
      open: true
    });
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  // Handle creating a new task
  const handleCreateNewTask = () => {
    if (!onTaskCreate) return;
    
    // Convert form data to task object
    const newTask: Omit<Task, 'id'> = {
      title: newTaskForm.title,
      description: '', // Empty description
      estimate: newTaskForm.estimate,
      blockedBy: [], // No blockers
      subtasks: [], // No subtasks
    };
    
    // Create the task
    onTaskCreate(newTask);
    
    // Reset form and close dialog
    handleCloseNewTaskDialog();
    showNotification('Task created successfully', 'success');
  };
  
  // Close dialog and reset form
  const handleCloseNewTaskDialog = () => {
    setIsNewTaskDialogOpen(false);
    setNewTaskForm({
      title: '',
      estimate: 1,
    });
  };
  
  // Handle form field changes
  const handleFormChange = (field: keyof NewTaskFormData, value: string | number | string[] | null) => {
    setNewTaskForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Check if form is valid
  const isFormValid = () => {
    return newTaskForm.title.trim() !== '' && newTaskForm.estimate > 0;
  };
  
  // Simple form content
  const renderFormContent = () => {
    return (
      <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField
          autoFocus
          label="Task Title"
          fullWidth
          required
          value={newTaskForm.title}
          onChange={(e) => handleFormChange('title', e.target.value)}
        />
        
        <TextField
          label="Estimate (days)"
          fullWidth
          type="number"
          inputProps={{ min: 0.25, step: 0.25 }}
          value={newTaskForm.estimate}
          onChange={(e) => handleFormChange('estimate', parseFloat(e.target.value) || 1)}
          helperText="Default: 1 day"
        />
      </Box>
    );
  };
  
  // Zoom in
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };
  
  // Zoom out
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };
  
  // Refresh diagram
  const handleRefresh = () => {
    // Re-render the diagram
    if (mermaidReady && (window as any).mermaid) {
      try {
        // Clear previous diagram
        const container = document.getElementById('mermaid-container');
        if (container) {
          container.innerHTML = '';
          
          // Create a div for the new diagram
          const diagramDiv = document.createElement('div');
          diagramDiv.className = 'mermaid';
          diagramDiv.textContent = mermaidCode;
          container.appendChild(diagramDiv);
          
          // Render new diagram
          (window as any).mermaid.init(undefined, document.querySelectorAll('.mermaid'));
        }
      } catch (error) {
        console.error('Failed to refresh Mermaid diagram:', error);
        showNotification('Failed to refresh task visualization', 'error');
      }
    }
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        height: '80vh',
        width: '100%',
        marginTop: 2,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">Task Timeline</Typography>
          <Typography variant="body2" color="text.secondary">
            Gantt chart showing task dependencies and hierarchies
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Zoom out">
            <IconButton onClick={handleZoomOut}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          
          <Typography sx={{ display: 'flex', alignItems: 'center', minWidth: '60px', justifyContent: 'center' }}>
            {zoomLevel}%
          </Typography>
          
          <Tooltip title="Zoom in">
            <IconButton onClick={handleZoomIn}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Refresh diagram">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Box sx={{ 
        flexGrow: 1, 
        height: '100%', 
        overflow: 'auto',
        padding: 2,
      }}>
        {!mermaidReady ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading visualization...</Typography>
          </Box>
        ) : (
          <Box 
            id="mermaid-container" 
            sx={{ 
              minHeight: '500px',
              minWidth: '100%',
              transition: 'transform 0.3s ease',
            }}
          />
        )}
      </Box>
      
      <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          Tasks: {tasks.length} • Relationships: {tasks.reduce((count, task) => count + (task.blockedBy?.length || 0), 0)}
        </Typography>
        
        <Button 
          variant="outlined" 
          size="small"
          onClick={() => window.open(`https://mermaid.live/edit#${encodeURIComponent(mermaidCode)}`, '_blank')}
        >
          Edit in Mermaid Live
        </Button>
      </Box>
      
      {/* Floating Action Button for creating tasks */}
      {onTaskCreate && (
        <Tooltip title="Create new task" placement="left">
          <Fab 
            color="primary" 
            onClick={() => setIsNewTaskDialogOpen(true)}
            sx={{ 
              position: 'absolute', 
              bottom: 32, 
              right: 32,
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}
      
      {/* New Task Dialog */}
      <Dialog 
        open={isNewTaskDialogOpen} 
        onClose={handleCloseNewTaskDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Create New Task</Typography>
          <IconButton onClick={handleCloseNewTaskDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          {renderFormContent()}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseNewTaskDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateNewTask}
            disabled={!isFormValid()}
            color="primary"
          >
            Create Task
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
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
    </Paper>
  );
};

export default TaskRelationshipGraph;