import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCheck, X } from 'lucide-react';
import { ChatMessage } from '../types';
import { useDb } from '../context/DbContext';

interface WhatsAppChatProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export default function WhatsAppChat({ isOpen, onClose, onOpen }: WhatsAppChatProps) {
  const { settings } = useDb();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'agent',
      text: 'Welcome to Sun Pyramids Tours! ☀️ I am Reem Ibrahim, your travel consultant for Egyptian destinations, classic excursions, and Spring specials. How can I assist you with planning your dream trip today?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const whatsappNumber = settings?.whatsapp || '201207300811';

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate authentic typing delay and personalized reply
    setTimeout(() => {
      setIsTyping(false);
      let responseText = "Excellent choice! 🐫 This tour package is highly requested and features as one of our best-sellers this week. We can secure your booking at a premium 5-star resort with an additional pyramids tour included for free. Do you prefer luxury boutique stays or desert glamping instead?";
      
      const query = inputText.toLowerCase();
      if (query.includes('price') || query.includes('discount') || query.includes('cost') || query.includes('offer')) {
        responseText = "Great question! We currently have a 15% early-bird discount on all Nile River cruises and desert safaris for the upcoming travel season. I can prepare a custom quotation document for you right now!";
      } else if (query.includes('safari') || query.includes('desert') || query.includes('siwa')) {
        responseText = "The desert and western oases are magical! Our tours feature modern 4x4 Land Cruisers, licensed local Bedouin guides, and luxury glamping sites with modern amenities. How many people are in your travel party?";
      }

      const agentMsg: ChatMessage = {
        sender: 'agent',
        text: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMsg]);
    }, 1500);
  };

  return (
    <>
      {/* Floating launcher button at the bottom-right corner */}
      <button 
        onClick={onOpen}
        id="whatsapp-floater-button"
        className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-600 text-white p-4 sm:p-5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer group"
        title="Live Chat Support"
      >
        <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full border border-white animate-pulse" />
        <span className="font-bold text-white text-md tracking-wider flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.166.001 6.138 1.233 8.37 3.468C22.46 5.703 23.7 8.675 23.7 11.839c-.004 6.515-5.329 11.839-11.86 11.839-2.002-.001-3.968-.51-5.713-1.48L0 24zm6.59-4.846c1.6.95 3.1 1.455 4.693 1.456 5.385-.002 9.761-4.37 9.764-9.754a9.61 9.61 0 0 0-2.84-6.883C15.932 1.637 13.987.973 11.86.972c-5.385 0-9.762 4.369-9.765 9.752-.001 1.705.452 3.37 1.314 4.8l-.297 1.085.3 1.091 1-.274z" />
          </svg>
          <span className="max-w-0 overflow-hidden group-hover:max-w-32 transition-all duration-300 hover:ml-1 font-semibold text-xs tracking-wider uppercase font-sans">Chat WhatsApp</span>
        </span>
      </button>

      {/* Slide-Up Whatsapp Chat Box */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[340px] max-w-full z-10 bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col h-[480px] font-sans animate-fade-in text-left" dir="ltr">
          
          {/* Header */}
          <div className="bg-[#075e54] text-white p-4 flex items-center justify-between select-none shadow">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" 
                  alt="Advisor"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-emerald-400" 
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm tracking-tight">Reem Ibrahim 🇪🇬</span>
                <span className="text-[10px] text-emerald-100">Personal Travel Consultant</span>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="text-white hover:bg-emerald-800 p-1.5 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat message body screen */}
          <div className="flex-grow p-4 overflow-y-auto bg-[#eae6df] space-y-3.5 scrollbar-thin">
            {messages.map((msg, i) => {
              const isAgent = msg.sender === 'agent';
              return (
                <div 
                  key={i} 
                  className={`flex ${isAgent ? 'justify-start' : 'justify-end'} animate-fade-in`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-xs relative leading-relaxed text-left ${
                      isAgent 
                        ? 'bg-white text-gray-800 rounded-tl-none' 
                        : 'bg-[#d9fdd3] text-gray-800 rounded-tr-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <div className="flex justify-end items-center gap-1 text-[9px] text-gray-400 mt-1">
                      <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {!isAgent && <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-405 rounded-2xl rounded-tr-none px-4 py-2.5 text-xs shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce delay-200" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white px-4 py-2 text-center border-b border-gray-100">
            <a 
              href={`https://wa.me/${whatsappNumber}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-[10px] sm:text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
            >
              💬 Click here to continue this conversation on WhatsApp
            </a>
          </div>

          {/* Form input messaging */}
          <form onSubmit={handleSendMessage} className="p-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2 select-none">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message to Reem..."
              className="flex-grow bg-white border border-gray-200 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            />
            <button 
              type="submit" 
              className="bg-[#0f6b5b] hover:bg-emerald-800 text-white p-2.5 rounded-full shadow-lg transition duration-200 self-center shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
