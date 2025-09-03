import { NavigationLayout } from '@/components/layout/NavigationLayout';

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NavigationLayout>{children}</NavigationLayout>;
}
