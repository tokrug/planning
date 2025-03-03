'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PersonDetail } from '@/components/person/PersonDetail';

export default function PersonDetailPage() {
  const params = useParams();
  const personId = params.id as string;
  
  return <PersonDetail personId={personId} />;
}