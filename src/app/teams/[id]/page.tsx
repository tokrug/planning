'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { TeamDetail } from '@/components/team/TeamDetail';

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params.id as string;
  
  return <TeamDetail teamId={teamId} />;
}