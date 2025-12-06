import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, Message, User } from '../types';
import { Send, ArrowLeft, MoreVertical, CheckCircle } from 'lucide-react';
import { api } from '../services/db';
import { RatingModal } from './RatingModal';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInterfaceProps {
  session: ChatSession;
  currentUser: User;
  onBack: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ session, currentUser, onBack }) => {
  const [messages, setMessages] = useState<Message[]>(session.messages);
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showRating, setShowRating] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const otherUser = session.participants.find(p => p.id !== currentUser.id) || session.participants[0];

  useEffect(() => {
    // Scroll to bottom on load and update
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const txt = input;
    setInput(""); // Optimistic update
    
    const tempMsg: Message = {
        id: "temp_" + Date.now(),
        senderId: currentUser.id,
        text: txt,
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
        await api.chats.sendMessage(session.id, txt);
    } catch (e) {
        console.error("Failed to send", e);
    }
  };

  const handleRate = (rating: number, comment: string) => {
    console.log(`Rated ${otherUser.name}: ${rating} stars. Comment: ${comment}`);
    // In a real app, save this to DB
    const sysMsg: Message = {
        id: "sys_rate_" + Date.now(),
        senderId: 'system',
        text: `You rated ${otherUser.name} ${rating} stars!`,
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, sysMsg]);
  };

  return (
    <>
    <div className="fixed inset-0 bg-white z-[60] flex flex-col">
      {/* Header */}
      <div className="h-16 bg-white border-b border-slate-100 flex items-center px-4 justify-between shadow-sm relative z-20">
        <div className="flex items-center">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors">
                <ArrowLeft size={24} className="text-slate-700" />
            </button>
            <img src={otherUser.avatar} className="w-10 h-10 rounded-full ml-2 object-cover border border-slate-100" alt="User" />
            <div className="ml-3">
                <h3 className="font-bold text-slate-800 text-sm">{otherUser.name}</h3>
                <p className="text-xs text-slate-500 truncate max-w-[150px]">{session.rideName}</p>
            </div>
        </div>
        
        <div className="relative">
            <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full hover:bg-slate-50 transition-colors"
            >
                <MoreVertical size={20} className="text-slate-400" />
            </button>
            
            <AnimatePresence>
                {showMenu && (
                    <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20"
                    >
                        <button 
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 font-medium flex items-center"
                            onClick={() => { setShowMenu(false); setShowRating(true); }}
                        >
                            <CheckCircle size={16} className="mr-2 text-green-500" />
                            Complete & Rate
                        </button>
                        <button className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-slate-50 font-medium">
                            Report Issue
                        </button>
                    </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4 pb-20" ref={scrollRef}>
        {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const isSystem = msg.senderId === 'system';
            
            if (isSystem) {
                return (
                    <div key={msg.id} className="flex justify-center my-4">
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200/60 px-3 py-1 rounded-full tracking-wide">
                            {msg.text}
                        </span>
                    </div>
                );
            }

            return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`
                        max-w-[80%] p-3 rounded-2xl text-sm shadow-sm break-words relative
                        ${isMe 
                            ? 'bg-violet-600 text-white rounded-br-sm' 
                            : 'bg-white text-slate-700 rounded-bl-sm border border-slate-100'
                        }
                    `}>
                        <p className="leading-relaxed mr-8">{msg.text}</p>
                        <span className={`text-[9px] absolute bottom-1 right-2 ${isMe ? 'text-violet-200' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                </div>
            );
        })}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-100 safe-bottom">
        <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 border border-slate-200 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
            <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-sm py-1"
            />
            <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className={`ml-2 p-2 rounded-full transition-all duration-200 ${input.trim() ? 'bg-violet-600 text-white shadow-md hover:bg-violet-700' : 'bg-slate-300 text-slate-500'}`}
            >
                <Send size={18} />
            </button>
        </div>
      </div>
    </div>

    {/* Rating Modal */}
    <RatingModal 
        isOpen={showRating}
        onClose={() => setShowRating(false)}
        personName={otherUser.name}
        personAvatar={otherUser.avatar}
        onSubmit={handleRate}
    />
    </>
  );
};
