
import React from 'react';
import { Card } from '@/components/ui/card';

interface DataSourceCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  to?: string;
  badge?: string;
}

const DataSourceCard = ({ children, onClick, to, badge }: DataSourceCardProps) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const cardContent = (
    <Card className="flex items-center p-4 hover:bg-accent transition-colors border border-input hover:scale-105 transition-transform duration-200">
      <div className="flex items-center">
        {children}
      </div>
      {badge && (
        <span className="ml-auto bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1 rounded">
          {badge}
        </span>
      )}
    </Card>
  );

  if (to) {
    return (
      <a href={to} onClick={handleClick}>
        {cardContent}
      </a>
    );
  }

  return (
    <div className="cursor-pointer" onClick={handleClick}>
      {cardContent}
    </div>
  );
};

export default DataSourceCard;
