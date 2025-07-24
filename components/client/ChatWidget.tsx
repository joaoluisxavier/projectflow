import React, { useState, useRef, useEffect } from 'react';
import { ChatIcon } from '../icons/ChatIcon';
import { CloseIcon } from '../icons/CloseIcon';
import { ChatMessage } from '../../types';
// As duas linhas abaixo foram removidas
// import { sendMessageToBotStream } from '../../services/geminiService';
// import { GenerateContentResponse } from '@google/genai';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  // Função handleSendMessage foi modificada para apenas simular uma resposta
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    const botReply: ChatMessage = { 
        id: botMessageId, 
        sender: 'bot', 
        text: 'Olá! No momento, a função de chat está em manutenção. Por favor, entre em contato por outros canais.' 
    };

    // Simula um tempo de resposta do bot
    setTimeout(() => {
        setMessages(prev => [...prev, botReply]);
        setIsLoading(false);
    }, 1000);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-teal-600 text-white p-4 rounded-full shadow-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-transform hover:scale-110"
        >
          {isOpen ? <CloseIcon /> : <ChatIcon />}
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-sm h-[60vh] bg-white rounded-lg shadow-2xl flex flex-col z-40">
          <header className="bg-teal-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold text-lg">Assistente Virtual</h3>
          </header>
          <main className="flex-1 p-4 overflow-y-auto bg-gray-50">
            <div className="space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                    <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                 <div className="flex justify-start">
                    <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none">
                       <div className="flex items-center space-x-2">
                           <span className="h-2 w-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                           <span className="h-2 w-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                           <span className="h-2 w-2 bg-teal-500 rounded-full animate-bounce"></span>
                       </div>
                    </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </main>
          <footer className="p-4 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 disabled:bg-teal-300"
                disabled={isLoading || !input.trim()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </footer>
        </div>
      )}
    </>
  );
};

export default ChatWidget;