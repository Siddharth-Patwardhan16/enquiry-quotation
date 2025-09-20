import { NavigationLayout } from '@/components/layout/NavigationLayout';

export default function CustomerDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationLayout>
      {children}
    </NavigationLayout>
  );
}
