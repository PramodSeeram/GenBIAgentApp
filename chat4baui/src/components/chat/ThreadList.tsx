
import React from 'react';
import { cn } from '@/lib/utils';

interface ThreadListProps {
  threads: Array<{ id: number; title: string; date: string }>;
  theme?: 'light' | 'dark';
}

const ThreadList: React.FC<ThreadListProps> = ({ threads, theme = 'light' }) => {
  return (
    <div className="space-y-2">
      {threads.map(thread => (
        <div
          key={thread.id}
          className={cn(
            "p-2 rounded-md cursor-pointer",
            theme === 'dark' 
              ? 'hover:bg-gray-800' 
              : 'hover:bg-gray-100'
          )}
        >
          <p className={cn(
            "text-sm line-clamp-2",
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            {thread.title}
          </p>
          <p className={cn(
            "text-xs mt-1",
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          )}>
            {thread.date}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ThreadList;
