'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Container, Typography, Box, Breadcrumbs } from '@mui/material';
import Link from 'next/link';
import { PersonDetail } from '@/components/person/PersonDetail';

export default function WorkspacePersonDetailPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const personId = params.id as string;
  
  return (
    <Container sx={{ py: 4 }}>
      <Box mb={4}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href="/workspaces">Workspaces</Link>
          <Link href={`/workspaces/${workspaceId}`}>Workspace</Link>
          <Link href={`/workspaces/${workspaceId}/people`}>People</Link>
          <Typography color="text.primary">Person Details</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" mt={2}>
          Person Details
        </Typography>
      </Box>
      
      <PersonDetail workspaceId={workspaceId} personId={personId} />
    </Container>
  );
} 