import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, MessageSquarePlus } from 'lucide-react';

interface FollowupQuestionsProps {
  theme?: 'light' | 'dark';
  question: string;
  answer: string;
  onQuestionClick?: (question: string) => void;
}

const FollowupQuestions = ({ 
  theme = 'light', 
  question,
  answer,
  onQuestionClick 
}: FollowupQuestionsProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!question || !answer) return;
      
      setIsLoading(true);
      
      try {
        const response = await fetch('/api/suggest-followups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question, answer }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch follow-up suggestions');
        }
        
        const data = await response.json();
        
        if (data.success && data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        } else {
          setSuggestions([
            "Can you explain that in more detail?",
            "How does that relate to my business?",
            "What actions should I take based on this?"
          ]);
        }
      } catch (error) {
        console.error('Error fetching followup suggestions:', error);
        setSuggestions([
          "Can you explain that in more detail?",
          "How does that relate to my business?",
          "What actions should I take based on this?"
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [question, answer]);

  const handleQuestionClick = (question: string) => {
    if (onQuestionClick) {
      onQuestionClick(question);
    }
  };

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="mt-1 mb-4">
      <div className="flex items-center space-x-1 mb-2">
        <MessageSquarePlus className={cn(
          "h-3.5 w-3.5",
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        )} />
        <span className={cn(
          "text-xs font-medium",
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        )}>
          Follow-up Questions
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <div className={cn(
            "flex items-center px-3 py-1.5 rounded-full text-xs",
            theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
          )}>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            <span>Thinking...</span>
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <button
              key={index}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                theme === 'dark' 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
              onClick={() => handleQuestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default FollowupQuestions; 