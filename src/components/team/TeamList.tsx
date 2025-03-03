'use client';

import React, { useState, useEffect } from 'react';
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
import { getAllTeams, deleteTeam } from '@/repository/teamRepository';

interface TeamListProps {
  onDeleted: () => void;
}

export const TeamList: React.FC<TeamListProps> = ({ onDeleted }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await getAllTeams();
      setTeams(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch teams');
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await deleteTeam(id);
        await fetchTeams();
        onDeleted();
      } catch (err) {
        setError('Failed to delete team');
        console.error('Error deleting team:', err);
      }
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isRowExpanded = (id: string): boolean => {
    return !!expandedRows[id];
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
        {error}
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
                      window.location.href = `/teams/${team.id}`;
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