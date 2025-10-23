// 'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { withBase } from '@/lib/nav';

export default function Nav() {
  const pathname = usePathname() || '';
  const inDemo = pathname.startsWith('/demo');
  const links = [
    { label: 'Overview', href: withBase(inDemo, '/overview') },
    { label: 'Scenario Planning Lab', href: withBase(inDemo, '/scenarios') },
    { label: 'Business Insights', href: withBase(inDemo, '/insights') },
    { label: 'Opportunities', href: withBase(inDemo, '/opportunities') },
    { label: 'Demand', href: withBase(inDemo, '/demand') },
    { label: 'Inventory', href: withBase(inDemo, '/inventory') },
    { label: 'Assets', href: withBase(inDemo, '/assets') },
    { label: 'Tax', href: withBase(inDemo, '/tax') },
    { label: 'Reviews', href: withBase(inDemo, '/reviews') },
    { label: 'Health', href: withBase(inDemo, '/health') },
    { label: 'Debt', href: withBase(inDemo, '/debt') },
    { label: 'Fraud & Compliance', href: withBase(inDemo, '/fraud-compliance') },
    { label: 'Users', href: withBase(inDemo, '/users') },
    { label: 'Business Profile', href: withBase(inDemo, '/profile') },
    { label: 'Settings', href: withBase(inDemo, '/settings') },
  ];
  return (
    <nav className="flex gap-4 items-center">
      {links.map(l => (
        <Link key={l.href} href={l.href} className="text-sm hover:underline">{l.label}</Link>
      ))}
      {inDemo && (
        <span className="ml-auto text-xs rounded px-2 py-1 border">Demo Mode — sample data</span>
      )}
    </nav>
  );
}
