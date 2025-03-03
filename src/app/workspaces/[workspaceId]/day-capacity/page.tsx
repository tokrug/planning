'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Typography, Box, Breadcrumbs } from '@mui/material';
import Link from 'next/link';
import { DayCapacityManager } from '@/components/day-capacity';

export default function WorkspaceDayCapacityPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  
  return (
    <Box sx={{ width: '100%', py: 4 }}>
      <Box mb={4}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href="/workspaces">Workspaces</Link>
          <Link href={`/workspaces/${workspaceId}`}>Workspace</Link>
          <Typography color="text.primary">Day Capacities</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" mt={2}>
          Day Capacities
        </Typography>
      </Box>
      
      <DayCapacityManager workspaceId={workspaceId} />
    </Box>
  );
} 