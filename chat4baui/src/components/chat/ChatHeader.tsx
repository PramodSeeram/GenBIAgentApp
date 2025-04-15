
import React from 'react';

interface ChatHeaderProps {
  theme?: 'light' | 'dark';
}

const ChatHeader = ({ theme = 'light' }: ChatHeaderProps) => {
  return (
    <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/3e1ee360-da09-4f2a-bb6b-83fd2b834e3c.png" 
          alt="Chat4BA" 
          className="h-8 w-8 mr-2"
        />
        <span className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : ''}`}>Chat4BA</span>
      </div>
    </div>
  );
};

export default ChatHeader;
