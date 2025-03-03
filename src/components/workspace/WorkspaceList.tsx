'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton,
  Paper,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Workspace } from '@/types/Workspace';
import { getAllWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } from '@/repository/workspaceRepository';

export function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const data = await getAllWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode: 'create' | 'edit', workspace?: Workspace) => {
    setDialogMode(mode);
    setErrorMessage('');
    
    if (mode === 'edit' && workspace) {
      setCurrentWorkspace(workspace);
      setWorkspaceName(workspace.name);
    } else {
      setCurrentWorkspace(null);
      setWorkspaceName('');
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveWorkspace = async () => {
    if (!workspaceName.trim()) {
      setErrorMessage('Workspace name is required');
      return;
    }

    try {
      if (dialogMode === 'create') {
        await createWorkspace({ name: workspaceName });
      } else if (dialogMode === 'edit' && currentWorkspace) {
        await updateWorkspace(currentWorkspace.id, { name: workspaceName });
      }
      
      fetchWorkspaces();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving workspace:', error);
      setErrorMessage('Failed to save workspace');
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this workspace? This will delete all associated teams, people, tasks, and other data.')) {
      try {
        await deleteWorkspace(id);
        fetchWorkspaces();
      } catch (error) {
        console.error('Error deleting workspace:', error);
      }
    }
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    router.push(`/workspaces/${workspace.id}`);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h1">Workspaces</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          New Workspace
        </Button>
      </Box>
      
      <Paper elevation={2}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : workspaces.length > 0 ? (
          <List>
            {workspaces.map((workspace, index) => (
              <React.Fragment key={workspace.id}>
                {index > 0 && <Divider />}
                <ListItem
                  button
                  onClick={() => handleWorkspaceClick(workspace)}
                  secondaryAction={
                    <Box>
                      <IconButton 
                        edge="end" 
                        aria-label="edit" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog('edit', workspace);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkspace(workspace.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText primary={workspace.name} />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box p={3} textAlign="center">
            <Typography color="textSecondary">
              No workspaces found. Create your first workspace to get started.
            </Typography>
          </Box>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New Workspace' : 'Edit Workspace'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Workspace Name"
            type="text"
            fullWidth
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            error={!!errorMessage}
            helperText={errorMessage}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveWorkspace} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 