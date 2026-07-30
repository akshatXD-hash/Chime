import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { NavRail } from './components/Sidebar/NavRail';
import { ChatList } from './components/Sidebar/ChatList';
import { UserSearchModal } from './components/Sidebar/UserSearchModal';
import { NewGroupModal } from './components/Sidebar/NewGroupModal';
import { ChatHeader } from './components/Chat/ChatHeader';
import { MessageList } from './components/Chat/MessageList';
import { MessageInput } from './components/Chat/MessageInput';
import { ChatDetailsSidebar } from './components/Chat/ChatDetailsSidebar';
import { ProfileModal } from './components/Modals/ProfileModal';
import { MessageSquare } from 'lucide-react';

const MainLayout = () => {
  const { user } = useAuth();
  const { selectedChat, setSelectedChat } = useChat();

  const [activeTab, setActiveTab] = useState('chats');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-devs-bg overflow-hidden text-devs-text select-none">
      {/* 1. Left Vertical Nav Rail */}
      <NavRail
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenSettings={() => setIsProfileModalOpen(true)}
      />

      {/* 2. Middle Column: Chat List Sidebar */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} h-full flex-shrink-0`}>
        <ChatList
          onOpenSearchModal={() => setIsSearchModalOpen(true)}
          onOpenGroupModal={() => setIsGroupModalOpen(true)}
        />
      </div>

      {/* 3. Main Active Chat Window */}
      <div className={`flex-1 flex flex-col h-full min-w-0 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedChat ? (
          <>
            <ChatHeader
              onToggleDetails={() => setIsDetailsOpen(!isDetailsOpen)}
              onBackMobile={() => setSelectedChat(null)}
            />
            <MessageList />
            <MessageInput />
          </>
        ) : (
          /* Empty Chat Selection Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-devs-bg relative overflow-hidden select-none">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-devs-blue via-blue-600 to-indigo-600 flex items-center justify-center shadow-glow-blue mb-6">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              Chime Web for <span className="devs-gradient-text">100xDevs</span>
            </h1>
            <p className="text-sm text-devs-textSecondary max-w-md mb-6 leading-relaxed">
              Send and receive real-time messages, share audio notes, and collaborate with your team instantly.
            </p>
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="px-6 py-3 rounded-xl devs-gradient-btn text-white font-semibold text-sm shadow-glow-blue"
            >
              Start New Conversation
            </button>
          </div>
        )}
      </div>

      {/* 4. Right Collapsible Chat Details Drawer */}
      <ChatDetailsSidebar isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />

      {/* Modals */}
      <UserSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
      <NewGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
};

const AuthWrapper = () => {
  const { user } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  if (!user) {
    return isRegistering ? (
      <Register onSwitchToLogin={() => setIsRegistering(false)} />
    ) : (
      <Login onSwitchToRegister={() => setIsRegistering(true)} />
    );
  }

  return (
    <SocketProvider>
      <ChatProvider>
        <MainLayout />
      </ChatProvider>
    </SocketProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
}
