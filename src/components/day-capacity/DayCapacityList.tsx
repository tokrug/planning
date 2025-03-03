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
  Tooltip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DayCapacity } from '@/types/DayCapacity';
import { useEntityCollection } from '@/lib/firebase/entityHooks';

interface DayCapacityListProps {
  workspaceId: string;
  onEdit: (dayCapacity: DayCapacity) => void;
  onListChanged: () => void;
}

export const DayCapacityList: React.FC<DayCapacityListProps> = ({ 
  workspaceId, 
  onEdit, 
  onListChanged 
}) => {
  // Use our real-time hook for day capacities
  const { 
    entities: dayCapacities, 
    loading, 
    error, 
    deleteEntity 
  } = useEntityCollection<DayCapacity>(
    workspaceId, 
    'dayCapacities',
    [], // no conditions
    [{ field: 'name', direction: 'asc' }] // sort by name
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this day capacity?')) {
      try {
        await deleteEntity(id);
        onListChanged();
      } catch (err) {
        console.error('Error deleting day capacity:', err);
      }
    }
  };

  // Helper to format availability as percentage
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
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Availability</TableCell>
            <TableCell>Visual</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dayCapacities.map((dayCapacity) => (
            <TableRow key={dayCapacity.id}>
              <TableCell>{dayCapacity.id}</TableCell>
              <TableCell>{dayCapacity.name}</TableCell>
              <TableCell>{formatAvailability(dayCapacity.availability)}</TableCell>
              <TableCell>
                <Box sx={{ width: '100%', maxWidth: 200 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={dayCapacity.availability * 100} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      bgcolor: 'grey.300',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: dayCapacity.availability === 0 ? 'error.main' : 'success.main'
                      }
                    }}
                  />
                </Box>
              </TableCell>
              <TableCell>
                <Tooltip title="Edit">
                  <IconButton onClick={() => onEdit(dayCapacity)} color="primary">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton onClick={() => handleDelete(dayCapacity.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {dayCapacities.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <Typography variant="body1">No day capacities found</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};