
import React from 'react';
import SuggestedQuestions from './SuggestedQuestions';
import { cn } from '@/lib/utils';

interface ChatMainProps {
  theme?: 'light' | 'dark';
}

const ChatMain = ({ theme = 'light' }: ChatMainProps) => {
  return (
    <div className={cn(
      "flex-1 overflow-y-auto p-4",
      theme === 'dark' ? 'bg-gray-900' : 'bg-white'
    )}>
      <div className="max-w-3xl mx-auto">
        {/* Welcome message */}
        <div className="mb-8 text-center">
          <h1 className={cn(
            "text-2xl font-bold mb-2",
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          )}>
            Ask me anything about your data
          </h1>
          <p className={cn(
            "text-sm",
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            I can help you explore and analyze your business data. Ask me questions in natural language.
          </p>
        </div>
        
        {/* Suggested questions */}
        <SuggestedQuestions theme={theme} />
      </div>
    </div>
  );
};

export default ChatMain;
