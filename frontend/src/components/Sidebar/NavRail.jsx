import { Avatar } from '../Common/Avatar';
import React from 'react';
import { MessageSquare, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const NavRail = ({ hiddenOnMobile, onOpenProfile, onOpenSettings }) => {
  const { user, logout } = useAuth();
  const { socketConnected, connectionStatus } = useSocket();

  const isConnected = socketConnected || connectionStatus === 'connected';

  return (
    <div className={`${hiddenOnMobile ? 'hidden md:flex' : 'flex'} w-full md:w-16 lg:w-20 h-14 md:h-full bg-devs-surface/95 border-t md:border-t-0 md:border-r border-devs-border/80 flex flex-row md:flex-col items-center justify-between px-4 py-2 md:px-0 md:py-5 select-none z-30 flex-shrink-0 order-last md:order-first`}>
      {/* Top / Left Section - Logo Brand Mark */}
      <div className="flex flex-row md:flex-col items-center space-x-3 md:space-x-0 md:space-y-6">
        <div 
          className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-devs-blue flex items-center justify-center  cursor-pointer transition-transform active:scale-95" 
          title="Chime Workspace"
        >
          <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
      </div>

      {/* Bottom / Right Section - Settings, Profile & Logout */}
      <div className="flex flex-row md:flex-col items-center space-x-2 md:space-x-0 md:space-y-3.5 px-0 md:px-2">
        <button
          onClick={onOpenSettings}
          title="Settings & Preferences"
          className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-devs-textSecondary hover:bg-devs-hover hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Profile Avatar Button */}
        <button
          onClick={onOpenProfile}
          title={`Signed in as ${user?.name || 'User'}`}
          aria-label={`Your profile: ${user?.name || 'User'}`}
          className="relative w-9 h-9 md:w-10 md:h-10 rounded-2xl border border-devs-border hover:border-devs-blue/60 transition-all overflow-hidden flex items-center justify-center bg-devs-card shadow-subtle group"
        >
          <Avatar src={user?.pic} name={user?.name} />
          {/* Real-time status dot */}
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-devs-surface ${
              isConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            title={isConnected ? 'Real-time Connected' : 'Connecting to Socket...'}
          />
        </button>

        <button
          onClick={() => logout()}
          title="Sign Out"
          className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

