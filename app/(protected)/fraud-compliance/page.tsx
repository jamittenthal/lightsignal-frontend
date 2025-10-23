import FraudClient from './FraudClient';
import React from 'react';

export const metadata = { title: 'Fraud & Compliance' };

export default function FraudPage(){
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Fraud & Compliance</h1>
      <FraudClient />
    </div>
  );
}
