
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, LogOut, RefreshCw, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import ChatHeader from './ChatHeader';
import ThreadList from './ThreadList';

interface ChatSidebarProps {
  theme?: 'light' | 'dark';
}

const ChatSidebar = ({ theme = 'light' }: ChatSidebarProps) => {
  const navigate = useNavigate();
  
  // Sample threads data
  const threads = [
    { id: 1, title: 'How does the total amount billed vary across different regions in the last year?', date: '2d ago' },
    { id: 2, title: 'Can you list the line items or services included in invoice #1234?', date: '3d ago' },
  ];

  const handleLogout = () => {
    // Simulating logout functionality
    toast.success("Logged out successfully");
    // Navigate to login page after short delay
    setTimeout(() => navigate('/login'), 1000);
  };

  const handleReset = () => {
    // Simulating data reset functionality
    toast.info("Data reset initiated", {
      description: "Your data is being reset, this may take a moment."
    });
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <div className={cn(
      "w-64 border-r flex flex-col",
      theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
    )}>
      <ChatHeader theme={theme} />
      
      {/* Navigation Links */}
      <div className="p-4">
        <div 
          className={cn(
            "flex items-center space-x-2 px-2 py-2 rounded-md cursor-pointer",
            theme === 'dark' 
              ? 'text-gray-300 hover:bg-gray-800' 
              : 'text-gray-700 hover:bg-gray-100'
          )}
          onClick={() => navigate('/dashboard')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>Dashboard</span>
        </div>
      </div>
      
      {/* Thread List */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className={cn(
              "font-medium flex items-center",
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            )}>
              Threads
              <span className={cn(
                "ml-1 text-xs rounded-full px-2",
                theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
              )}>2</span>
            </h2>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only">New Thread</span>
            </Button>
          </div>
          <ThreadList threads={threads} theme={theme} />
        </div>
      </div>
      
      {/* Settings */}
      <div className={cn(
        "p-4 border-t",
        theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
      )}>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="h-5 w-5 mr-2" />
              Settings
            </Button>
          </PopoverTrigger>
          <PopoverContent className={cn(
            "w-56",
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''
          )}>
            <div className="flex flex-col gap-2">
              <Button variant="ghost" className="justify-start hover:bg-destructive/10 transition-colors" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              <Button variant="ghost" className="justify-start hover:bg-primary/10 transition-colors" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Data
              </Button>
              <Button variant="ghost" className="justify-start hover:bg-accent transition-colors" onClick={handleSettings}>
                <Settings className="h-4 w-4 mr-2" />
                App Settings
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ChatSidebar;
