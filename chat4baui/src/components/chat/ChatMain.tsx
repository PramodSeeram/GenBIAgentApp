import React, { useRef, useEffect } from 'react';
import SuggestedQuestions from './SuggestedQuestions';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, User, AlertCircle } from 'lucide-react';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

export interface Message {
  id: string;
  sender: 'user' | 'ai' | 'system';
  content: string;
  isError?: boolean;
}

interface ChatMainProps {
  messages?: Message[];
  theme?: 'light' | 'dark';
  isGenerating?: boolean;
}

const ChatMain = ({ messages = [], theme = 'light', isGenerating = false }: ChatMainProps) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  return (
    <div className={cn(
      "flex-1 overflow-y-auto p-4",
      theme === 'dark' ? 'bg-gray-900' : 'bg-white'
    )}>
      <div className="max-w-3xl mx-auto">
        {messages.length === 0 ? (
          <>
            {/* Welcome message */}
            <div className="mb-8 text-center">
              <h1 className={cn(
                "text-2xl font-bold mb-2",
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              )}>
                Ask me anything about your data
              </h1>
              <p className={cn(
                "text-sm",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                I can help you explore and analyze your business data. Ask me questions in natural language.
              </p>
            </div>
            
            {/* Suggested questions */}
            <SuggestedQuestions theme={theme} />
          </>
        ) : (
          <AnimatePresence>
            <div className="space-y-6">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className={cn(
                    "p-4 rounded-lg",
                    message.sender === 'user' ? 
                      theme === 'dark' ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-100' 
                    : message.isError ? 
                      theme === 'dark' ? 'bg-red-900/20 border border-red-800/30' : 'bg-red-50 border border-red-100'
                    : theme === 'dark' ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      message.sender === 'user' ? 
                        theme === 'dark' ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-700'
                      : message.isError ?
                        theme === 'dark' ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-700'  
                      : theme === 'dark' ? 'bg-indigo-900 text-indigo-100' : 'bg-indigo-100 text-indigo-700'
                    )}>
                      {message.sender === 'user' ? (
                        <User size={16} />
                      ) : message.isError ? (
                        <AlertCircle size={16} />
                      ) : (
                        <Bot size={16} />
                      )}
                    </div>
                    
                    <div className="flex-1 prose prose-sm max-w-none leading-relaxed">
                      <div className={cn(
                        "break-words",
                        theme === 'dark' ? 'prose-invert' : '',
                        message.sender === 'ai' && !message.isError ? 'animate-typing' : ''
                      )}>
                        <ReactMarkdown 
                          rehypePlugins={[rehypeRaw]}
                          remarkPlugins={[remarkGfm]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};

export default ChatMain;
