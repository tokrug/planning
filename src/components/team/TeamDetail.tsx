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
  ListItemSecondary, 
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
  Snackbar
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
  teamId: string;
}

export const TeamDetail: React.FC<TeamDetailProps> = ({ teamId }) => {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddPersonDialogOpen, setIsAddPersonDialogOpen] = useState(false);
  const [availablePeople, setAvailablePeople] = useState<Person[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    open: boolean;
  }>({
    message: '',
    type: 'success',
    open: false
  });

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const teamData = await getTeamById(teamId);
      
      if (teamData) {
        setTeam(teamData);
        setTeamName(teamData.name);
      } else {
        setError('Team not found');
      }
    } catch (err) {
      console.error('Error fetching team:', err);
      setError('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditName = () => {
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!team || teamName.trim() === '') return;
    
    try {
      await updateTeam(team.id, { name: teamName });
      setIsEditingName(false);
      // Update the team in state
      setTeam({
        ...team,
        name: teamName
      });
      showNotification('Team name updated successfully', 'success');
    } catch (err) {
      console.error('Error updating team name:', err);
      showNotification('Failed to update team name', 'error');
    }
  };

  const handleAddPerson = async () => {
    try {
      // Fetch all persons
      const allPersons = await getAllPersons();
      
      // Filter out persons already in the team
      const teamPersonIds = team?.people.map(p => p.id) || [];
      const filteredPersons = allPersons.filter(person => !teamPersonIds.includes(person.id));
      
      setAvailablePeople(filteredPersons);
      setIsAddPersonDialogOpen(true);
    } catch (err) {
      console.error('Error loading available people:', err);
      showNotification('Failed to load available people', 'error');
    }
  };

  const handleAddPersonToTeam = async (person: Person) => {
    if (!team) return;
    
    try {
      await addPersonToTeam(team.id, person);
      setIsAddPersonDialogOpen(false);
      
      // Update the team in state
      setTeam({
        ...team,
        people: [...team.people, person]
      });
      
      showNotification(`Added ${person.name} to the team`, 'success');
    } catch (err) {
      console.error('Error adding person to team:', err);
      showNotification('Failed to add person to team', 'error');
    }
  };

  const handleRemovePerson = async (personId: string) => {
    if (!team) return;
    
    try {
      await removePersonFromTeam(team.id, personId);
      
      // Update the team in state
      setTeam({
        ...team,
        people: team.people.filter(p => p.id !== personId)
      });
      
      showNotification('Team member removed successfully', 'success');
    } catch (err) {
      console.error('Error removing person from team:', err);
      showNotification('Failed to remove team member', 'error');
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
    return <LinearProgress />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!team) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Team not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => router.push('/teams')}
        sx={{ mb: 2 }}
      >
        Back to Teams
      </Button>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          {isEditingName ? (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <TextField
                fullWidth
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
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
        open={isAddPersonDialogOpen} 
        onClose={() => setIsAddPersonDialogOpen(false)}
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
                  button
                  onClick={() => handleAddPersonToTeam(person)}
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
              There are no available people to add to this team. You need to create more people first.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddPersonDialogOpen(false)}>Cancel</Button>
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