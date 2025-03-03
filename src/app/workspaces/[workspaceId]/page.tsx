'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Container, Typography, Box, Button, CircularProgress, Paper, Grid } from '@mui/material';
import { PeopleAlt as PeopleIcon, Groups as TeamsIcon, Task as TasksIcon } from '@mui/icons-material';
import Link from 'next/link';
import { getWorkspaceById } from '@/repository/workspaceRepository';
import { Workspace } from '@/types/Workspace';

export default function WorkspaceDetailPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkspace = async () => {
      setLoading(true);
      try {
        const data = await getWorkspaceById(workspaceId);
        if (data) {
          setWorkspace(data);
        } else {
          setError('Workspace not found');
        }
      } catch (err) {
        console.error('Error fetching workspace:', err);
        setError('Failed to load workspace');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !workspace) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error || 'Workspace not found'}
          </Typography>
          <Button component={Link} href="/workspaces" variant="contained">
            Back to Workspaces
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          {workspace.name}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Workspace ID: {workspace.id}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              '&:hover': { bgcolor: 'action.hover' }
            }}
            component={Link}
            href={`/workspaces/${workspaceId}/teams`}
          >
            <TeamsIcon sx={{ fontSize: 64, mb: 2, color: 'primary.main' }} />
            <Typography variant="h6" gutterBottom>Teams</Typography>
            <Typography variant="body2" color="textSecondary">
              Manage teams in this workspace
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              '&:hover': { bgcolor: 'action.hover' }
            }}
            component={Link}
            href={`/workspaces/${workspaceId}/people`}
          >
            <PeopleIcon sx={{ fontSize: 64, mb: 2, color: 'primary.main' }} />
            <Typography variant="h6" gutterBottom>People</Typography>
            <Typography variant="body2" color="textSecondary">
              Manage people in this workspace
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              '&:hover': { bgcolor: 'action.hover' }
            }}
            component={Link}
            href={`/workspaces/${workspaceId}/tasks`}
          >
            <TasksIcon sx={{ fontSize: 64, mb: 2, color: 'primary.main' }} />
            <Typography variant="h6" gutterBottom>Tasks</Typography>
            <Typography variant="body2" color="textSecondary">
              Manage tasks in this workspace
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 