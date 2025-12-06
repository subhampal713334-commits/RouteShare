import React from 'react';
import { Home, Search, MessageCircle, User, Plus } from 'lucide-react';
import { Tab } from '../types';

interface BottomNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onPostClick: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange, onPostClick }) => {
  const navItemClass = (tab: Tab) => `
    flex flex-col items-center justify-center w-16 h-full transition-colors duration-200
    ${activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}
  `;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-4 pointer-events-none">
      <div className="relative w-[92%] max-w-md pointer-events-auto">
        
        {/* FAB */}
        <button
          onClick={onPostClick}
          className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30 z-50 hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus size={32} strokeWidth={2.5} />
        </button>

        {/* Bar */}
        <div className="h-[70px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 flex items-center justify-between px-2 border border-slate-100/50">
          <button onClick={() => onTabChange('home')} className={navItemClass('home')}>
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">Home</span>
          </button>
          
          <button onClick={() => onTabChange('find')} className={navItemClass('find')}>
            <Search size={24} strokeWidth={activeTab === 'find' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">Find</span>
          </button>

          {/* Spacer for FAB */}
          <div className="w-16" />

          <button onClick={() => onTabChange('chat')} className={navItemClass('chat')}>
            <MessageCircle size={24} strokeWidth={activeTab === 'chat' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">Chat</span>
          </button>
          
          <button onClick={() => onTabChange('profile')} className={navItemClass('profile')}>
            <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
