
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SendHorizonal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSubmit?: (message: string) => void;
  theme?: 'light' | 'dark';
}

const ChatInput = ({ onSubmit, theme = 'light' }: ChatInputProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      if (onSubmit) onSubmit(message);
      setMessage('');
    }
  };

  return (
    <div className={cn(
      "p-4 border-t",
      theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200'
    )}>
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
        <div className={cn(
          "flex items-center border rounded-lg overflow-hidden",
          theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300'
        )}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask a question about your data..."
            className={cn(
              "w-full px-4 py-2 focus:outline-none",
              theme === 'dark' ? 'bg-gray-800 text-white placeholder:text-gray-400' : 'bg-white'
            )}
          />
          <Button 
            type="submit" 
            variant={theme === 'dark' ? 'ghost' : 'default'}
            size="icon"
            className={cn(
              "mr-1",
              theme === 'dark' ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700' : ''
            )}
          >
            <SendHorizonal size={18} />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
