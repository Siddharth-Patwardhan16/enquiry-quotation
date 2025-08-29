interface StatCardProps {
  title: string;
  value?: number;
  isLoading: boolean;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

export function StatCard({ title, value, isLoading, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {isLoading ? (
              <span className="animate-pulse">--</span>
            ) : (
              value ?? 0
            )}
          </div>
        </div>
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

