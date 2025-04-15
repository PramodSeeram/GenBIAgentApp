
import React from 'react';
import { cn } from '@/lib/utils';

interface SuggestedQuestionsProps {
  theme?: 'light' | 'dark';
}

const SuggestedQuestions = ({ theme = 'light' }: SuggestedQuestionsProps) => {
  return (
    <div className="w-full mb-8">
      <div className={cn(
        "inline-block rounded-full px-3 py-1 text-sm font-medium mb-2",
        theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
      )}>
        Comparative Questions
      </div>
      
      <div className={cn(
        "border rounded-md p-4",
        theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
      )}>
        <p>
          How does the total amount billed vary across different regions in the last year?
        </p>
      </div>
    </div>
  );
};

export default SuggestedQuestions;
