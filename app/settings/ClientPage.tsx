type Props = { companyId?: string };

export default function ClientPage({ companyId }: Props) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <p className="text-gray-600">Configure your application settings and preferences. {companyId && `Using data for ${companyId}`}</p>
      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <p className="text-sm text-gray-500">Settings dashboard coming soon...</p>
      </div>
    </div>
  );
}