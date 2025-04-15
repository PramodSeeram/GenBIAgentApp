
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, Settings } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ModelSidebarProps {
  models: Array<{ id: number; name: string }>;
}

const ModelSidebar: React.FC<ModelSidebarProps> = ({ models }) => {
  return (
    <aside className="bg-card h-full w-64 border-r border-border flex flex-col">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h2 className="font-medium">Models</h2>
            <span className="ml-2 bg-muted text-muted-foreground text-xs rounded-full px-2 py-0.5">{models.length}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
            <span className="sr-only">New</span>
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <ul className="space-y-1">
            {models.map(model => (
              <li key={model.id}>
                <div className={cn(
                  "flex items-center px-2 py-1.5 text-sm rounded-md cursor-pointer",
                  model.id === 1 ? "bg-primary/10" : "hover:bg-muted"
                )}>
                  <ChevronDown className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="flex-grow overflow-hidden overflow-ellipsis whitespace-nowrap">
                    {model.name}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>
      
      {/* Settings */}
      <div className="mt-auto p-4 border-t border-border">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </aside>
  );
};

export default ModelSidebar;
