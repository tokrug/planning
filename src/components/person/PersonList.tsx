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
  Chip,
  Box,
  Tooltip,
  Collapse,
  Stack,
  Link as MuiLink
} from '@mui/material';
import Link from 'next/link';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CalendarMonth as CalendarIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import { Person } from '@/types/Person';
import { getAllPersons, deletePerson } from '@/repository/personRepository';

interface PersonListProps {
  onDeleted: () => void;
}

export const PersonList: React.FC<PersonListProps> = ({ onDeleted }) => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const fetchPersons = async () => {
    try {
      setLoading(true);
      const data = await getAllPersons();
      setPersons(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch people');
      console.error('Error fetching people:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      try {
        await deletePerson(id);
        await fetchPersons();
        onDeleted();
      } catch (err) {
        setError('Failed to delete person');
        console.error('Error deleting person:', err);
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

  // Helper to format day availability
  const formatAvailability = (value: number): string => {
    return `${value * 100}%`;
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
            <TableCell>Name</TableCell>
            <TableCell>Skills</TableCell>
            <TableCell>Schedule</TableCell>
            <TableCell>Exceptions</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {persons.map((person) => (
            <React.Fragment key={person.id}>
              <TableRow>
                <TableCell>
                  <Link href={`/people/${person.id}`} passHref legacyBehavior>
                    <MuiLink 
                      sx={{ 
                        cursor: 'pointer',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {person.name}
                    </MuiLink>
                  </Link>
                </TableCell>
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
                    {person.skills.length === 0 && <Typography variant="caption">No skills defined</Typography>}
                  </Stack>
                </TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    onClick={() => toggleRow(person.id)}
                    aria-label="expand row"
                  >
                    {isRowExpanded(person.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                  <CalendarIcon sx={{ ml: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                </TableCell>
                <TableCell>
                  {person.scheduleExceptions.length} exceptions
                </TableCell>
                <TableCell>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(person.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
              
              {/* Expanded details row for weekly schedule */}
              <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                  <Collapse in={isRowExpanded(person.id)} timeout="auto" unmountOnExit>
                    <Box sx={{ margin: 2 }}>
                      <Typography variant="h6" gutterBottom component="div">
                        Weekly Schedule
                      </Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Day</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Availability</TableCell>
                            <TableCell>Visual</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {/* Display weekdays in correct order */}
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                            const dayCapacity = person.weeklySchedule[day as keyof typeof person.weeklySchedule];
                            return (
                              <TableRow key={day}>
                                <TableCell component="th" scope="row" sx={{ textTransform: 'capitalize' }}>
                                  {day}
                                </TableCell>
                                <TableCell>{dayCapacity.name}</TableCell>
                                <TableCell>{formatAvailability(dayCapacity.availability)}</TableCell>
                                <TableCell>
                                  <Box sx={{ width: '100%', maxWidth: 100 }}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={dayCapacity.availability * 100} 
                                      sx={{ 
                                        height: 8, 
                                        borderRadius: 5,
                                        bgcolor: 'grey.300',
                                        '& .MuiLinearProgress-bar': {
                                          bgcolor: dayCapacity.availability === 0 ? 'error.main' : 'success.main'
                                        }
                                      }}
                                    />
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      
                      {person.scheduleExceptions.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="h6" gutterBottom component="div">
                            Schedule Exceptions
                          </Typography>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Day</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Availability</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {person.scheduleExceptions.map((exception, index) => {
                                // Convert date string to Date object to get day name
                                const date = new Date(exception.date);
                                const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
                                
                                return (
                                  <TableRow key={index}>
                                    <TableCell>{exception.date}</TableCell>
                                    <TableCell>{dayName}</TableCell>
                                    <TableCell>{exception.availability.name}</TableCell>
                                    <TableCell>{formatAvailability(exception.availability.availability)}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
          {persons.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <Typography variant="body1">No people found</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};