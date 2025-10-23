import AppShell from '@/components/AppShell';
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <AppShell demo>{children}</AppShell>;
}
