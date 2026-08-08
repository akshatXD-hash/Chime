import React from 'react';
import { MessageSquare, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const NavRail = ({ activeTab, setActiveTab, onOpenProfile, onOpenSettings }) => {
  const { user, logout } = useAuth();
  const { socketConnected } = useSocket();

  return (
    <div className="w-16 md:w-20 h-full bg-devs-surface/95 border-r border-devs-border/80 flex flex-col items-center justify-between py-5 select-none z-20 flex-shrink-0">
      {/* Top Section - Logo Brand Mark */}
      <div className="flex flex-col items-center w-full space-y-6">
        <div 
          className="w-10 h-10 rounded-2xl bg-gradient-to-br from-devs-blue to-devs-indigo flex items-center justify-center shadow-glow-blue cursor-pointer transition-transform active:scale-95" 
          title="Chime Workspace"
        >
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Bottom Section - Settings, Profile & Logout */}
      <div className="flex flex-col items-center space-y-3.5 w-full px-2">
        <button
          onClick={onOpenSettings}
          title="Settings & Preferences"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-devs-textSecondary hover:bg-devs-hover hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Profile Avatar Button */}
        <button
          onClick={onOpenProfile}
          title={user?.name || 'Profile'}
          className="relative w-10 h-10 rounded-2xl border border-devs-border hover:border-devs-blue/60 transition-all overflow-hidden flex items-center justify-center bg-devs-card shadow-subtle group"
        >
          {user?.pic ? (
            <img src={user.pic} alt={user.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <UserIcon className="w-4 h-4 text-devs-textSecondary" />
          )}
          {/* Real-time status dot */}
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-devs-surface ${
              socketConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            title={socketConnected ? 'Real-time Connected' : 'Connecting to Socket...'}
          />
        </button>

        <button
          onClick={logout}
          title="Sign Out"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
