import { cn } from "./utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'default' | 'card' | 'table' | 'text' | 'avatar' | 'button';
  lines?: number;
}

function Skeleton({ className, variant = 'default', lines = 1, ...props }: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700";
  
  const variants = {
    default: "h-4 w-full rounded",
    card: "h-32 w-full rounded-lg",
    table: "h-16 w-full rounded",
    text: "h-4 w-full rounded",
    avatar: "h-10 w-10 rounded-full",
    button: "h-10 w-24 rounded-md"
  };

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClasses, variants[variant], className)}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, variants[variant], className)}
      {...props}
    />
  );
}

// Pre-built skeleton components for common use cases
export const DashboardSkeleton = () => (
  <div className="p-6 space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
          <Skeleton variant="text" className="w-1/2 mb-2" />
          <Skeleton variant="text" className="w-3/4 h-8" />
        </div>
      ))}
    </div>
    
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <Skeleton variant="text" className="w-1/3 mb-4" />
        <Skeleton variant="card" className="h-64" />
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <Skeleton variant="text" className="w-1/3 mb-4" />
        <Skeleton variant="card" className="h-64" />
      </div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
    <div className="p-6">
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton variant="avatar" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="w-3/4" />
              <Skeleton variant="text" className="w-1/2" />
            </div>
            <Skeleton variant="button" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const NavigationSkeleton = () => (
  <div className="h-screen bg-gray-50 flex">
    {/* Sidebar Skeleton */}
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Skeleton variant="avatar" className="w-8 h-8" />
            <div className="space-y-1">
              <Skeleton variant="text" className="w-24" />
              <Skeleton variant="text" className="w-32" />
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 px-3 py-6">
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3">
                <Skeleton variant="avatar" className="w-5 h-5" />
                <Skeleton variant="text" className="w-20" />
              </div>
            ))}
          </div>
        </div>
        
        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <Skeleton variant="avatar" />
            <div className="flex-1 space-y-1">
              <Skeleton variant="text" className="w-24" />
              <Skeleton variant="text" className="w-16" />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Main Content Skeleton */}
    <div className="flex-1 flex flex-col">
      <main className="flex-1 overflow-auto">
        <DashboardSkeleton />
      </main>
    </div>
  </div>
);

export { Skeleton };
