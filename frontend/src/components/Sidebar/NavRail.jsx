import React from 'react';
import { MessageSquare, CircleDashed, Phone, Star, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const NavRail = ({ activeTab, setActiveTab, onOpenProfile, onOpenSettings }) => {
  const { user, logout } = useAuth();
  const { socketConnected } = useSocket();

  const navItems = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'status', label: 'Status', icon: CircleDashed },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'starred', label: 'Starred', icon: Star },
  ];

  return (
    <div className="w-16 md:w-20 h-full bg-devs-surface border-r border-devs-border flex flex-col items-center justify-between py-4 select-none z-20 flex-shrink-0">
      {/* Top Section - Logo & Main Nav */}
      <div className="flex flex-col items-center w-full space-y-6">
        {/* App Logo */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-devs-blue via-blue-600 to-indigo-600 flex items-center justify-center shadow-glow-blue cursor-pointer transition-transform hover:scale-105">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col items-center space-y-3 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-devs-blue text-white shadow-glow-blue'
                    : 'text-devs-textSecondary hover:bg-devs-hover hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {isActive && (
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-devs-blue rounded-r-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section - Settings, Profile & Logout */}
      <div className="flex flex-col items-center space-y-3 w-full px-2">
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="w-12 h-12 rounded-xl flex items-center justify-center text-devs-textSecondary hover:bg-devs-hover hover:text-white transition-all"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Profile Avatar Button */}
        <button
          onClick={onOpenProfile}
          title={user?.name || 'Profile'}
          className="relative w-11 h-11 rounded-full border-2 border-devs-border hover:border-devs-blue transition-colors overflow-hidden flex items-center justify-center bg-devs-card"
        >
          {user?.pic ? (
            <img src={user.pic} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-5 h-5 text-devs-textSecondary" />
          )}
          {/* Socket online status indicator dot */}
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-devs-surface ${
              socketConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            title={socketConnected ? 'Connected' : 'Connecting...'}
          />
        </button>

        <button
          onClick={logout}
          title="Sign Out"
          className="w-12 h-12 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
