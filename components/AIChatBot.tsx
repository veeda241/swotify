import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { chatWithInsight } from '../services/geminiService';
import { DataService } from '../services/dataService';
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react';

interface AIChatBotProps {
  currentUser: User;
}

const AIChatBot: React.FC<AIChatBotProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: `Hi ${currentUser.name}! I'm your Swotify AI Assistant. How can I help you analyze the data today?` }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const context = DataService.getContextForUser(currentUser);
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await chatWithInsight(history, userMsg, context);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an error analyzing the data." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all transform hover:scale-105 z-40 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 bg-indigo-600 text-white'
        }`}
      >
        <MessageSquare size={28} />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-6 w-96 max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 z-50 ${
          isOpen ? 'translate-y-0 opacity-100 h-[500px]' : 'translate-y-10 opacity-0 h-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-indigo-600 rounded-t-2xl text-white">
          <div className="flex items-center gap-2">
            <Bot size={20} />
            <span className="font-semibold">Swotify AI</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] p-3 text-sm rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                <Loader2 className="animate-spin text-slate-400" size={16} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-100 bg-white rounded-b-2xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about performance..."
              className="flex-1 px-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIChatBot;
