import HealthClient from './HealthClient';
import React from 'react';

export const metadata = { title: 'Business Health' };

export default function HealthPage() {
  // Server component could fetch initial data, but per "backend-first" we prefer client fetch.
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Business Health</h1>
      <HealthClient />
    </div>
  );
}
