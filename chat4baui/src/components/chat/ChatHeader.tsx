
import React from 'react';

interface ChatHeaderProps {
  theme?: 'light' | 'dark';
}

const ChatHeader = ({ theme = 'light' }: ChatHeaderProps) => {
  return (
    <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/Favicon-_1_-removebg-preview.png" 
          alt="Chat4BA" 
          className="h-8 w-8 mr-2"
        />
        <span className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : ''}`}>Chat4BA</span>
      </div>
    </div>
  );
};

export default ChatHeader;
