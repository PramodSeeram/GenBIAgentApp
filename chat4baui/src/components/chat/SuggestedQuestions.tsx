import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SuggestedQuestion {
  question: string;
  context: string;
}

interface SuggestedQuestionsProps {
  theme?: 'light' | 'dark';
  onQuestionClick?: (question: string) => void;
}

const SuggestedQuestions = ({ theme = 'light', onQuestionClick }: SuggestedQuestionsProps) => {
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendedQuestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/recommended-questions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommended questions');
      }
      
      const data = await response.json();
      
      if (data.success && data.recommendations) {
        setSuggestedQuestions(data.recommendations);
      } else {
        setSuggestedQuestions([
          { question: "What insights can I gain from my uploaded files?", context: "General analysis" },
          { question: "Can you summarize the key data points in my files?", context: "Data summary" },
          { question: "How can I use this data to make better business decisions?", context: "Decision making" },
        ]);
      }
    } catch (err) {
      console.error('Error fetching recommended questions:', err);
      setError('Failed to load recommendations');
      setSuggestedQuestions([
        { question: "What insights can I gain from my uploaded files?", context: "General analysis" },
        { question: "Can you summarize the key data points in my files?", context: "Data summary" },
        { question: "How can I use this data to make better business decisions?", context: "Decision making" },
      ]);
      toast.error('Could not load recommended questions', {
        description: 'Using default suggestions instead',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch when component mounts
  useEffect(() => {
    fetchRecommendedQuestions();
  }, []);

  const handleQuestionClick = (question: string) => {
    if (onQuestionClick) {
      onQuestionClick(question);
    }
  };

  if (suggestedQuestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
          theme === 'dark' ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
        )}>
          <Sparkles className="mr-2 h-3.5 w-3.5" />
          Recommended Questions
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchRecommendedQuestions}
          disabled={isLoading}
          className={cn(
            "text-xs",
            theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {isLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : 'Refresh'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {isLoading ? (
          <div className={cn(
            "col-span-2 flex items-center justify-center p-6 border rounded-md",
            theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
          )}>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            <span className="text-sm">Generating recommendations...</span>
          </div>
        ) : (
          suggestedQuestions.map((question, index) => (
            <div 
              key={index}
              className={cn(
                "border rounded-md p-3 hover:shadow-md transition-all cursor-pointer",
                theme === 'dark' 
                  ? 'border-gray-700 bg-gray-800/70 hover:bg-gray-800 text-gray-200' 
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
              )}
              onClick={() => handleQuestionClick(question.question)}
            >
              <p className="font-medium text-sm">{question.question}</p>
              <p className={cn(
                "text-xs mt-1",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                {question.context}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
