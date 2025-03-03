'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Typography, Box, Breadcrumbs } from '@mui/material';
import Link from 'next/link';
import { TeamManager } from '@/components/team/TeamManager';

export default function WorkspaceTeamsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  
  return (
    <Box sx={{ width: '100%', py: 4 }}>
      <Box mb={4}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href="/workspaces">Workspaces</Link>
          <Link href={`/workspaces/${workspaceId}`}>Workspace</Link>
          <Typography color="text.primary">Teams</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" mt={2}>
          Teams
        </Typography>
      </Box>
      
      <TeamManager workspaceId={workspaceId} />
    </Box>
  );
} 