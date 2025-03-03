'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LinearProgress } from '@mui/material';
import { DayCapacityManager } from '@/components/day-capacity';
import { getDefaultWorkspaceId } from '@/utils/workspaceUtils';

export default function DayCapacityPage() {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaceId = async () => {
      try {
        const defaultWorkspaceId = await getDefaultWorkspaceId();
        if (defaultWorkspaceId) {
          setWorkspaceId(defaultWorkspaceId);
        } else {
          // No default workspace found, redirect to workspaces page
          router.push('/workspaces');
        }
      } catch (error) {
        console.error('Error fetching default workspace:', error);
        router.push('/workspaces');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceId();
  }, [router]);

  if (loading) {
    return <LinearProgress />;
  }

  if (!workspaceId) {
    return null; // This will be short-lived as we're redirecting
  }
  
  return <DayCapacityManager workspaceId={workspaceId} />;
}