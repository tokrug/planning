'use client';

import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  LinearProgress,
  Typography,
  Box,
  Tooltip,
  Collapse,
  Chip,
  Stack,
  Avatar,
  AvatarGroup
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { Team } from '@/types/Team';
import { Person } from '@/types/Person';
import { deleteTeam } from '@/repository/teamRepository';
import { useEntityCollection } from '@/lib/firebase/entityHooks';
import { getPersonById } from '@/repository/personRepository';

interface TeamListProps {
  workspaceId: string;
  onDeleted?: () => void;
}

export const TeamList: React.FC<TeamListProps> = ({ workspaceId, onDeleted }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Transform function to hydrate person references
  const hydrateTeams = async (teams: (Team & { id: string })[], workspaceId: string): Promise<(Team & { id: string })[]> => {
    return await Promise.all(
      teams.map(async (team) => {
        // The people array from Firestore will be an array of string IDs
        const personIds = team.people as unknown as string[];
        
        // Fetch each person by ID (from workspace)
        const peoplePromises = personIds.map(id => getPersonById(workspaceId, id));
        const peopleResults = await Promise.all(peoplePromises);
        
        // Filter out any null results (in case a person was deleted)
        const people = peopleResults.filter((person): person is Person => person !== null);
        
        // Return the team with hydrated person objects
        return {
          ...team,
          people
        };
      })
    );
  };

  // Use our real-time hook for teams collection
  const { 
    entities: teams, 
    loading, 
    error, 
    deleteEntity
  } = useEntityCollection<Team>(
    workspaceId, 
    'teams',
    [], // no conditions
    [{ field: 'name', direction: 'asc' }], // sort by name
    hydrateTeams // transform function
  );

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isRowExpanded = (id: string): boolean => {
    return expandedRows.has(id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await deleteEntity(id);
        if (onDeleted) {
          onDeleted();
        }
      } catch (error) {
        console.error('Error deleting team:', error);
      }
    }
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
      <Typography color="error" variant="body1">
        {error.message}
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Team Name</TableCell>
            <TableCell>Members</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {teams.map((team) => (
            <React.Fragment key={team.id}>
              <TableRow>
                <TableCell>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        color: 'primary.main',
                      }
                    }}
                    onClick={() => {
                      window.location.href = `/workspaces/${workspaceId}/teams/${team.id}`;
                    }}
                  >
                    <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {team.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Show avatars for up to 5 team members */}
                    <AvatarGroup max={5} sx={{ mr: 2 }}>
                      {team.people.map(person => (
                        <Tooltip key={person.id} title={person.name}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {getInitials(person.name)}
                          </Avatar>
                        </Tooltip>
                      ))}
                    </AvatarGroup>
                    
                    {/* Show total count */}
                    <IconButton 
                      size="small" 
                      onClick={() => toggleRow(team.id)}
                      aria-label="expand row"
                    >
                      {isRowExpanded(team.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {team.people.length} member{team.people.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(team.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
              
              {/* Expanded details row for team members */}
              <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
                  <Collapse in={isRowExpanded(team.id)} timeout="auto" unmountOnExit>
                    <Box sx={{ margin: 2 }}>
                      <Typography variant="h6" gutterBottom component="div">
                        Team Members
                      </Typography>
                      
                      {team.people.length > 0 ? (
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Skills</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {team.people.map((person) => (
                              <TableRow key={person.id}>
                                <TableCell>{person.name}</TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {person.skills.map((skill, index) => (
                                      <Chip 
                                        key={index} 
                                        label={skill} 
                                        size="small" 
                                        color="primary" 
                                        variant="outlined" 
                                        sx={{ margin: '2px' }}
                                      />
                                    ))}
                                    {person.skills.length === 0 && (
                                      <Typography variant="caption">No skills defined</Typography>
                                    )}
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          This team doesn't have any members yet
                        </Typography>
                      )}
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
          {teams.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} align="center">
                <Typography variant="body1">No teams found</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};