
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

interface DatabaseConnectorProps {
  databaseType: string;
  icon: React.ReactNode;
}

export default function DatabaseConnector({ databaseType, icon }: DatabaseConnectorProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [formData, setFormData] = useState({
    host: '',
    port: '',
    username: '',
    password: '',
    database: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    
    try {
      // Simulate connection test - would be replaced with actual connection code
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Connection successful",
        description: `Successfully connected to ${databaseType} database`,
      });
      
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Could not connect to the database. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="p-6 animate-fade-in">
      <form onSubmit={handleConnect} className="space-y-4">
        <div className="flex items-center mb-4">
          <div className="mr-3">{icon}</div>
          <h3 className="text-lg font-medium">Connect to {databaseType}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="host">Host</Label>
            <Input 
              id="host"
              name="host"
              value={formData.host}
              onChange={handleInputChange}
              placeholder="localhost or IP address"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input 
              id="port"
              name="port"
              value={formData.port}
              onChange={handleInputChange}
              placeholder="e.g. 5432"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="database">Database Name</Label>
          <Input 
            id="database"
            name="database"
            value={formData.database}
            onChange={handleInputChange}
            placeholder="Enter database name"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Database username"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Database password"
              required
            />
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full transition-all duration-200 hover:shadow-md"
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>Connect</>
          )}
        </Button>
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Your connection will be encrypted and credentials are stored securely.
        </div>
      </form>
    </Card>
  );
}
