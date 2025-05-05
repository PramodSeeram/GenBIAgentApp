import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatMain, { Message } from '@/components/chat/ChatMain';
import ChatInput from '@/components/chat/ChatInput';
import { Button } from '@/components/ui/button';
import { Home, Database, RefreshCw, Sun, Moon, Check, ChevronDown, CircleCheck, Globe, XCircle } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { toast } from '@/hooks/use-toast';
import { askAllCollections } from '@/services/api';

interface LLMModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon?: React.ReactNode;
  isPro?: boolean;
}

interface ProcessingStep {
  step: string;
  status: 'pending' | 'complete' | 'error';
  detail?: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [activeModel, setActiveModel] = useState<LLMModel>({
    id: 'best',
    name: 'Best',
    provider: 'Auto',
    description: 'Selects the best model for each query'
  });
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

  // LLM model options
  const llmModels: LLMModel[] = [
    {
      id: 'best',
      name: 'Best',
      provider: 'Auto',
      description: 'Selects the best model for each query',
      icon: <CircleCheck className="h-4 w-4 text-emerald-500" />
    },
    {
      id: 'sonar',
      name: 'Sonar',
      provider: 'Perplexity',
      description: 'Perplexity\'s fast model'
    },
    {
      id: 'claude-3.7',
      name: 'Claude 3.7 Sonnet',
      provider: 'Anthropic',
      description: 'Anthropic\'s advanced model',
      isPro: true
    },
    {
      id: 'gpt-4',
      name: 'GPT-4.1',
      provider: 'OpenAI',
      description: 'OpenAI\'s advanced model',
      isPro: true
    },
    {
      id: 'gemini-2.5',
      name: 'Gemini 2.5 Pro',
      provider: 'Google',
      description: 'Google\'s latest model',
      isPro: true
    },
    {
      id: 'grok-2',
      name: 'Grok-2',
      provider: 'xAI',
      description: 'xAI\'s latest model',
      isPro: true
    }
  ];

  // Function to handle sending a message
  const handleSendMessage = async (query: string) => {
    if (!query.trim() || isProcessing) return;

    console.log("Chat: Sending message to backend:", query);

    // Add user message to chat
    const userMessage: Message = { 
      id: Date.now().toString(), 
      sender: 'user', 
      content: query 
    };
    setMessages(prev => [...prev, userMessage]);

    setIsProcessing(true);
    setProcessingSteps([{ step: 'Querying AI across documents...', status: 'pending' }]);

    try {
      console.log('Sending query to backend:', query);
      
      // Call the API with explicit debugging
      const response = await askAllCollections(query);
      console.log('Received response from backend:', response);
      
      setProcessingSteps([{ step: 'Querying AI across documents...', status: 'complete' }]);

      // Add AI response to chat
      if (response && response.answer) {
        console.log('Processing valid response with answer:', response.answer.substring(0, 50) + '...');
        
        const aiMessage: Message = { 
          id: (Date.now() + 1).toString(), 
          sender: 'ai', 
          content: response.answer 
        };
        setMessages(prev => [...prev, aiMessage]);
        
        toast({
          title: "Response received",
          description: "Got answer from the AI"
        });
      } else {
        console.error('Invalid response format from AI:', response);
        throw new Error('Invalid response format from AI');
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      setProcessingSteps([{ step: 'Error processing query', status: 'error' }]);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      
      toast({
        title: "Failed to get response", 
        description: errorMessage,
        variant: "destructive"
      });

      // Add error message to chat
      const errorMessageObj: Message = { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        content: `Sorry, I couldn't process your request: ${errorMessage}`, 
        isError: true 
      };
      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      // Clear processing indicator after a delay
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingSteps([]);
      }, 1000);
    }
  };

  const handleModelChange = (modelId: string) => {
    const selectedModel = llmModels.find(model => model.id === modelId);
    if (selectedModel) {
      toast({
        title: `Switched to ${selectedModel.name} model`,
        description: selectedModel.isPro ? 
          `You're now using ${selectedModel.provider}'s advanced model` : 
          undefined
      });
      setActiveModel(selectedModel);
      setModelSelectorOpen(false);
    }
  };

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white'}`}>
      {/* Sidebar */}
      <ChatSidebar theme={theme} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navigation options */}
        <div className={`flex items-center justify-between gap-2 p-2 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs flex items-center">
                <RefreshCw size={12} className="animate-spin mr-2" />
                Processing query...
              </div>
            ) : (
              <Popover open={modelSelectorOpen} onOpenChange={setModelSelectorOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2 w-[180px] justify-between"
                  >
                    <span className="flex items-center gap-1">
                      {activeModel.icon || <Globe className="h-4 w-4" />}
                      <span>{activeModel.name}</span>
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search models..." />
                    <CommandList>
                      <CommandEmpty>No models found.</CommandEmpty>
                      <CommandGroup heading="Available Models">
                        {llmModels.map((model) => (
                          <CommandItem 
                            key={model.id}
                            value={model.id}
                            onSelect={() => handleModelChange(model.id)}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium flex items-center gap-1.5">
                                {model.icon || <Globe className="h-4 w-4" />}
                                {model.name}
                                {model.isPro && (
                                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 text-[10px] px-1 rounded">PRO</span>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">{model.description}</span>
                            </div>
                            {model.id === activeModel.id && (
                              <Check className="h-4 w-4" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme} 
              className="rounded-full"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/')} className="flex items-center gap-1">
              <Home size={16} />
              <span>Home</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/modeling')} className="flex items-center gap-1">
              <Database size={16} />
              <span>Modeling</span>
            </Button>
          </div>
        </div>
        
        <ChatMain theme={theme} messages={messages} />
        
        {/* Processing indicator */}
        {isProcessing && (
          <div className={`mx-auto mb-4 w-2/3 p-4 rounded-lg animate-fade-in ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <h3 className="font-medium mb-2 text-sm">Processing your query</h3>
            <div className="space-y-2">
              {processingSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  {step.status === 'pending' && <RefreshCw size={14} className="animate-spin text-blue-500" />}
                  {step.status === 'complete' && <CircleCheck size={14} className="text-green-500" />}
                  {step.status === 'error' && <XCircle size={14} className="text-red-500" />}
                  <span className={`text-sm ${step.status === 'pending' ? 'text-blue-500 font-medium' : step.status === 'error' ? 'text-red-500' : ''}`}>
                    {step.step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Chat Input */}
        <ChatInput onSubmit={handleSendMessage} theme={theme} />
      </div>
    </div>
  );
};

export default Chat;
