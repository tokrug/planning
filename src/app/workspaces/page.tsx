'use client';

import React from 'react';
import { Container } from '@mui/material';
import { WorkspaceList } from '@/components/workspace';

export default function WorkspacesPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <WorkspaceList />
    </Container>
  );
} 