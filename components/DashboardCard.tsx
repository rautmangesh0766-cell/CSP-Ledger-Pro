import React from 'react';

interface DashboardCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, colorClass }) => {
  const formattedValue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center space-x-4 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
      <div className={`p-3 rounded-full ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{formattedValue}</p>
      </div>
    </div>
  );
};

export default DashboardCard;