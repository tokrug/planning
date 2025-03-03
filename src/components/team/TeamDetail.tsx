'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  TextField, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Chip, 
  Button, 
  Divider, 
  LinearProgress, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Team } from '@/types/Team';
import { Person } from '@/types/Person';
import { 
  getTeamById, 
  updateTeam, 
  removePersonFromTeam,
  addPersonToTeam
} from '@/repository/teamRepository';
import { getAllPersons } from '@/repository/personRepository';

interface TeamDetailProps {
  workspaceId: string;
  teamId: string;
}

export const TeamDetail: React.FC<TeamDetailProps> = ({ workspaceId, teamId }) => {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [availablePeople, setAvailablePeople] = useState<Person[]>([]);
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    type: 'info'
  });

  useEffect(() => {
    fetchTeam();
  }, [workspaceId, teamId]);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const data = await getTeamById(workspaceId, teamId);
      if (data) {
        setTeam(data);
        setNewName(data.name);
        setError(null);
      } else {
        setError('Team not found');
      }
    } catch (err) {
      setError('Failed to fetch team');
      console.error('Error fetching team:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditName = () => {
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!team || !newName.trim()) return;
    
    try {
      await updateTeam(workspaceId, teamId, { name: newName });
      setTeam({ ...team, name: newName });
      setEditingName(false);
      showNotification('Team name updated successfully', 'success');
    } catch (err) {
      showNotification('Failed to update team name', 'error');
      console.error('Error updating team name:', err);
    }
  };

  const handleAddPerson = async () => {
    try {
      const allPeople = await getAllPersons(workspaceId);
      
      // Filter out people who are already in the team
      const teamPersonIds = new Set(team?.people.map(p => p.id) || []);
      const filteredPeople = allPeople.filter(p => !teamPersonIds.has(p.id));
      
      setAvailablePeople(filteredPeople);
      setShowAddPersonDialog(true);
    } catch (err) {
      showNotification('Failed to fetch available people', 'error');
      console.error('Error fetching people:', err);
    }
  };

  const handleAddPersonToTeam = async (person: Person) => {
    if (!team) return;
    
    try {
      await addPersonToTeam(workspaceId, teamId, person);
      
      // Update the local state
      setTeam({
        ...team,
        people: [...team.people, person]
      });
      
      setShowAddPersonDialog(false);
      showNotification(`${person.name} added to the team`, 'success');
    } catch (err) {
      showNotification('Failed to add person to team', 'error');
      console.error('Error adding person to team:', err);
    }
  };

  const handleRemovePerson = async (personId: string) => {
    if (!team) return;
    
    if (window.confirm('Are you sure you want to remove this person from the team?')) {
      try {
        await removePersonFromTeam(workspaceId, teamId, personId);
        
        // Update the local state
        setTeam({
          ...team,
          people: team.people.filter(p => p.id !== personId)
        });
        
        showNotification('Person removed from team', 'success');
      } catch (err) {
        showNotification('Failed to remove person from team', 'error');
        console.error('Error removing person from team:', err);
      }
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({
      open: true,
      message,
      type
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !team) {
    return (
      <Container sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error">{error || 'Team not found'}</Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => router.push(`/workspaces/${workspaceId}/teams`)}
        sx={{ mb: 2 }}
      >
        Back to Teams
      </Button>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          {editingName ? (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <TextField
                fullWidth
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                label="Team Name"
                variant="outlined"
                size="small"
                autoFocus
              />
              <IconButton onClick={handleSaveName} color="primary">
                <SaveIcon />
              </IconButton>
            </Box>
          ) : (
            <>
              <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                {team.name}
              </Typography>
              <IconButton onClick={handleStartEditName} color="primary">
                <EditIcon />
              </IconButton>
            </>
          )}
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Team Members ({team.people.length})
            </Typography>
            <Button 
              startIcon={<PersonAddIcon />}
              variant="outlined"
              onClick={handleAddPerson}
            >
              Add Member
            </Button>
          </Box>
          
          {team.people.length > 0 ? (
            <List>
              {team.people.map((person) => (
                <ListItem
                  key={person.id}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="remove" 
                      onClick={() => handleRemovePerson(person.id)}
                      color="error"
                    >
                      <PersonRemoveIcon />
                    </IconButton>
                  }
                  divider
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {getInitials(person.name)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={person.name}
                    secondary={
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        {person.skills.map((skill, index) => (
                          <Chip 
                            key={index} 
                            label={skill} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        ))}
                        {person.skills.length === 0 && (
                          <Typography variant="caption">No skills defined</Typography>
                        )}
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              This team doesn't have any members yet. Add team members using the button above.
            </Alert>
          )}
        </Box>
      </Paper>
      
      {/* Dialog for adding a person to the team */}
      <Dialog 
        open={showAddPersonDialog} 
        onClose={() => setShowAddPersonDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Team Member</DialogTitle>
        <DialogContent>
          {availablePeople.length > 0 ? (
            <List>
              {availablePeople.map((person) => (
                <ListItem 
                  key={person.id}
                  onClick={() => handleAddPersonToTeam(person)}
                  divider
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {getInitials(person.name)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={person.name}
                    secondary={person.skills?.join(', ')}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              There are no available people to add to this team. You need to create more people first.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddPersonDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
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
    </Container>
  );
};