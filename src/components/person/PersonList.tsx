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
import { useEntityCollection } from '@/lib/firebase/entityHooks';

interface PersonListProps {
  workspaceId: string;
  onListChanged: () => void;
}

export const PersonList: React.FC<PersonListProps> = ({ workspaceId, onListChanged }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Use our real-time hook for people
  const { 
    entities: persons, 
    loading, 
    error, 
    deleteEntity 
  } = useEntityCollection<Person>(
    workspaceId, 
    'persons',
    [], // no conditions
    [{ field: 'name', direction: 'asc' }] // sort by name
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      try {
        await deleteEntity(id);
        onListChanged();
      } catch (err) {
        console.error('Error deleting person:', err);
      }
    }
  };

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
        {error.message}
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
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {persons.map((person) => (
            <React.Fragment key={person.id}>
              <TableRow>
                <TableCell>
                  <Link href={`/workspaces/${workspaceId}/people/${person.id}`} passHref>
                    <MuiLink underline="hover" color="inherit" sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">{person.name}</Typography>
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
                    {person.skills.length === 0 && (
                      <Typography variant="caption">No skills defined</Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Box>
                    <Tooltip title="Expand Details">
                      <IconButton 
                        size="small" 
                        onClick={() => toggleRow(person.id)}
                        aria-label="expand row"
                      >
                        {isRowExpanded(person.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        component={Link} 
                        href={`/workspaces/${workspaceId}/people/${person.id}`}
                        color="primary"
                      >
                        <WorkIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(person.id)} 
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
              
              {/* Expanded details row */}
              <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                  <Collapse in={isRowExpanded(person.id)} timeout="auto" unmountOnExit>
                    <Box sx={{ margin: 2 }}>
                      <Typography variant="subtitle1" gutterBottom component="div">
                        Person Details
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="primary">
                          <CalendarIcon sx={{ verticalAlign: 'middle', mr: 1 }} fontSize="small" />
                          Schedule
                        </Typography>
                        
                        {person.weeklySchedule ? (
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Day</TableCell>
                                <TableCell>Availability</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {Object.entries(person.weeklySchedule).map(([day, dayCapacity]) => (
                                <TableRow key={day}>
                                  <TableCell>{day}</TableCell>
                                  <TableCell>{dayCapacity.name} ({formatAvailability(dayCapacity.availability)})</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No schedule information available
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
          
          {persons.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} align="center">
                <Typography variant="body1">No people found</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};