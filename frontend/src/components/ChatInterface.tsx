import React, { useState } from 'react';
import axios from 'axios';

const ChatInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{text: string, isUser: boolean}>>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
  
    // Add user message to chat
    setMessages([...messages, { text: query, isUser: true }]);
    setLoading(true);
  
    try {
      const response = await axios.post('http://localhost:8000/api/query', { query });
      
      // Add response to chat
      setMessages(prev => [...prev, { text: response.data.response, isUser: false }]);
    } catch (error) {
      console.error('Error processing query:', error);
      setMessages(prev => [...prev, { text: 'Sorry, an error occurred while processing your query.', isUser: false }]);
    }
  
    setLoading(false);
    setQuery('');
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.isUser ? 'user' : 'bot'}`}>
            {message.text}
          </div>
        ))}
        {loading && <div className="message bot loading">Thinking...</div>}
      </div>
      
      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your data..."
        />
        <button type="submit" disabled={loading || !query.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
