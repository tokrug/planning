'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Typography, Box, Breadcrumbs } from '@mui/material';
import Link from 'next/link';
import { TeamDetail } from '@/components/team/TeamDetail';

export default function WorkspaceTeamDetailPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const teamId = params.id as string;
  
  return (
    <Box sx={{ width: '100%', py: 4 }}>
      <Box mb={4}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href="/workspaces">Workspaces</Link>
          <Link href={`/workspaces/${workspaceId}`}>Workspace</Link>
          <Link href={`/workspaces/${workspaceId}/teams`}>Teams</Link>
          <Typography color="text.primary">Team Details</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" mt={2}>
          Team Details
        </Typography>
      </Box>
      
      <TeamDetail workspaceId={workspaceId} teamId={teamId} />
    </Box>
  );
} 