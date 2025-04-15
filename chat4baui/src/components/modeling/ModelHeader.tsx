
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const ModelHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-gray-900 text-white border-b border-gray-700 p-4 flex items-center justify-between">
      <div className="flex items-center">
        <div className="mr-4">
          <img 
            src="/lovable-uploads/3e1ee360-da09-4f2a-bb6b-83fd2b834e3c.png" 
            className="h-8 w-8"
            alt="Chat4BA Logo" 
          />
        </div>
        <span className="text-xl font-medium">Chat4BA</span>
      </div>
      <div className="flex items-center space-x-4">
        <div className="ml-auto flex gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
          <div className="flex items-center text-green-400">
            <span className="h-2 w-2 rounded-full bg-green-400 mr-2"></span>
            Synced
          </div>
          <Button variant="outline" className="bg-green-600 hover:bg-green-700 text-white border-none">Deploy</Button>
        </div>
      </div>
    </header>
  );
};

export default ModelHeader;
