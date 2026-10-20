import React, { useState, Component } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
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
import { CallModal } from './components/Modals/CallModal';
import { MessageSquare, AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chime UI error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-devs-bg flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-5">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-xs text-devs-textMuted max-w-sm mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected rendering error occurred. Please reload to continue.'}
          </p>
          <button
            onClick={this.handleReload}
            className="px-5 py-2.5 rounded-xl bg-devs-blue hover:bg-devs-blueHover text-white font-semibold text-xs transition-colors shadow-subtle flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Application</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainLayout = () => {
  const { user } = useAuth();
  const { selectedChat, clearSelectedChat } = useChat();
  const { connectionStatus } = useSocket();

  const [activeTab, setActiveTab] = useState('chats');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState('audio'); // 'audio' | 'video'

  const currentUserId = user?._id || user?.id;
  const targetUser = selectedChat && !selectedChat.isGroupChat
    ? selectedChat.users?.find((u) => String(u?._id || u?.id || u) !== String(currentUserId)) || selectedChat.users?.[0]
    : null;

  const handleStartCall = (type) => {
    setCallType(type);
    setIsCallOpen(true);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen h-[100dvh] w-screen bg-devs-bg overflow-hidden text-devs-text select-none relative">
      {/* 1. Left Vertical Nav Rail / Mobile Bottom Bar */}
      <NavRail
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenSettings={() => setIsProfileModalOpen(true)}
      />

      {/* 2. Middle Column: Chat List Sidebar */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-1 md:flex-initial h-full flex-shrink-0 w-full md:w-auto overflow-hidden`}>
        <ChatList
          onOpenSearchModal={() => setIsSearchModalOpen(true)}
          onOpenGroupModal={() => setIsGroupModalOpen(true)}
        />
      </div>

      {/* 3. Main Active Chat Window */}
      <div className={`flex-1 flex flex-col h-full min-w-0 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Subtle Reconnecting Banner */}
        {connectionStatus === 'connecting' && (
          <div className="bg-devs-blue/15 border-b border-devs-blue/30 px-3 py-1 text-center text-[11px] text-devs-indigo font-medium flex items-center justify-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-devs-indigo animate-ping" />
            <span>Connecting to real-time server...</span>
          </div>
        )}

        {selectedChat ? (
          <>
            <ChatHeader
              onToggleDetails={() => setIsDetailsOpen(!isDetailsOpen)}
              onBackMobile={clearSelectedChat}
              onStartCall={handleStartCall}
            />
            <MessageList />
            <MessageInput key={selectedChat._id} />
          </>
        ) : (
          /* Empty Chat Selection Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-devs-bg relative overflow-hidden select-none">

            <div className="w-16 h-16 rounded-3xl bg-devs-surface border border-devs-border flex items-center justify-center shadow-card-dark mb-5 text-devs-indigo">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1.5">
              Welcome to <span className="devs-gradient-text">Chime</span>
            </h1>
            <p className="text-xs text-devs-textSecondary max-w-sm mb-6 leading-relaxed">
              Select an existing chat from the left panel or start a new conversation to begin messaging in real-time.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-devs-blue hover:bg-devs-blueHover text-white font-semibold text-xs transition-colors shadow-subtle flex items-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Start New Conversation</span>
              </button>
              <button
                onClick={() => setIsGroupModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-devs-card hover:bg-devs-hover border border-devs-border text-devs-textSecondary hover:text-white font-semibold text-xs transition-colors shadow-subtle flex items-center gap-2"
              >
                <span>Create Group</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Right Collapsible Chat Details Drawer */}
      <ChatDetailsSidebar isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />

      {/* Modals */}
      <UserSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
      <NewGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      <CallModal
        isOpen={isCallOpen}
        callType={callType}
        contactName={targetUser?.name || 'Call'}
        contactPic={targetUser?.pic}
        onClose={() => setIsCallOpen(false)}
      />
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
    <ErrorBoundary>
      <AuthProvider>
        <AuthWrapper />
      </AuthProvider>
    </ErrorBoundary>
  );
}

